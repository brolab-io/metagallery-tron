import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BigNumber, ethers } from 'ethers';
import { PaginateModel, PaginateOptions } from 'mongoose';
import { FindQueryResult } from '../../commons/decorator';
import { NFT, NFTDocument } from '../nfts/nft.schema';

type OrderAdded = [BigNumber, string, BigNumber, string, BigNumber];
type OrderMatched = [BigNumber, string, string, BigNumber, string, BigNumber];
type OrderCanceled = [BigNumber];

@Injectable()
export class MarketplaceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MarketplaceService.name);
  private readonly contractProvider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_URL,
  );
  private readonly marketplaceContractAddress =
    process.env.MARKETPLACE_CONTRACT_ADDRESS;

  private readonly abi = [
    'event OrderAdded(uint256 indexed, address indexed, uint256 indexed, address, uint256)',
    'event OrderMatched(uint256 indexed, address indexed, address indexed, uint256, address, uint256)',
    'event OrderCanceled(uint256 indexed)',
  ];

  private readonly marketplaceContract = new ethers.Contract(
    this.marketplaceContractAddress,
    this.abi,
    this.contractProvider,
  );

  constructor(
    @InjectModel(NFT.name)
    private readonly nftModel: PaginateModel<NFTDocument>,
  ) {
    this.handleOrderAddedEvent = this.handleOrderAddedEvent.bind(this);
    this.handleOrderMatchedEvent = this.handleOrderMatchedEvent.bind(this);
    this.handleOrderCanceledEvent = this.handleOrderCanceledEvent.bind(this);
  }

  async onApplicationBootstrap() {
    if (JSON.parse(process.env.SYNC_ENABLED)) {
      this.logger.log('Syncing previous marketplace events...');
      await this.syncPreviousMarketplaceEvents();
    }
    this.logger.log(`Subscribing to marketplace events...`);
    this.handleMarketplaceEvents();
  }

  async syncPreviousMarketplaceEvents() {
    const query1 = this.marketplaceContract.queryFilter('OrderAdded');
    const query2 = this.marketplaceContract.queryFilter('OrderMatched');
    const query3 = this.marketplaceContract.queryFilter('OrderCanceled');
    const [orderAddedEvents, orderMatchedEvents, orderCanceledEvents] =
      await Promise.all([query1, query2, query3]);

    // Sort events by block number
    const events = [
      ...orderAddedEvents,
      ...orderMatchedEvents,
      ...orderCanceledEvents,
    ].sort((a, b) => a.blockNumber - b.blockNumber);

    this.logger.log(`Found ${events.length} events to sync...`);

    // Process events
    for (const event of events) {
      switch (event.event) {
        case 'OrderAdded':
          await this.handleOrderAddedEvent(...(event.args as OrderAdded));
          break;
        case 'OrderMatched':
          await this.handleOrderMatchedEvent(...(event.args as OrderMatched));
          break;
        case 'OrderCanceled':
          await this.handleOrderCanceledEvent(...(event.args as OrderCanceled));
          break;
      }
    }
  }

  handleMarketplaceEvents() {
    this.marketplaceContract.on('OrderAdded', this.handleOrderAddedEvent);
    this.marketplaceContract.on('OrderMatched', this.handleOrderMatchedEvent);
    this.marketplaceContract.on('OrderCanceled', this.handleOrderCanceledEvent);
  }

  async handleOrderAddedEvent(...args: OrderAdded) {
    this.logger.log(
      `=> OrderID: ${args[0].toString()} TokenID: ${args[2].toString()} Owner: ${
        args[1]
      } PaymentToken: ${args[3]} Price: ${args[4].toString()}`,
    );
    return this.nftModel.findOneAndUpdate(
      {
        tokenId: args[2].toString(),
      },
      {
        marketId: args[0].toString(),
        marketPaymentToken: args[3],
        marketPrice: args[4].toString(),
      },
    );
  }

  async handleOrderMatchedEvent(...args: OrderMatched) {
    this.logger.log(`Processing OrderMatched event...`);
    this.logger.log(
      `=> OrderID: ${args[0].toString()} TokenID: ${args[3].toString()} NewOwner: ${
        args[2]
      } `,
    );
    return this.nftModel.findOneAndUpdate(
      {
        marketId: args[0].toString(),
      },
      {
        marketId: null,
        marketPaymentToken: null,
        marketPrice: null,
        owner: args[2],
      },
    );
  }

  async handleOrderCanceledEvent(...args: OrderCanceled) {
    this.logger.log(`Processing OrderCanceled event...`);
    this.logger.log(`=> OrderID: ${args[0].toString()}`);
    return this.nftModel.findOneAndUpdate(
      {
        marketId: args[0].toString(),
      },
      {
        marketId: null,
        marketPaymentToken: null,
        marketPrice: null,
      },
    );
  }

  async getMarketplaceItems(findQuery: FindQueryResult) {
    findQuery.filters['marketId'] = { $ne: null };
    const options: PaginateOptions = {
      ...findQuery.pagination,
      select: '-__v -_id',
      populate: [
        {
          path: 'collectionInfo',
          select: '-__v -_id -owner -createdAt -updatedAt -contract',
        },
        {
          path: 'paymentToken',
          select: '-__v -_id -updatedAt -createdAt -contract',
        },
      ],
    };
    return this.nftModel.paginate(findQuery.filters, options);
  }

  async getMarketplaceItem(marketId: string) {
    const item = await this.nftModel
      .findOne({ marketId })
      .select('-__v -_id -updatedAt')
      .populate(
        'collectionInfo',
        '-__v -_id -owner -createdAt -updatedAt -contract',
      )
      .populate('paymentToken', '-__v -_id -updatedAt -createdAt -contract');
    if (!item) {
      throw new NotFoundException(`Marketplace item not found`);
    }
    return item;
  }

  async getMarketItem(field: string, value: string) {
    const item = await this.nftModel
      .findOne({ [field]: value })
      .select('-__v -_id -updatedAt')
      .populate(
        'collectionInfo',
        '-__v -_id -owner -createdAt -updatedAt -contract',
      )
      .populate('paymentToken', '-__v -_id -updatedAt -createdAt -contract');
    if (!item) {
      throw new NotFoundException(`Marketplace item not found`);
    }
    return item;
  }
}
