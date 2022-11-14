import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BigNumber, ethers } from 'ethers';
import { PaginateModel, PaginateOptions } from 'mongoose';
import { FindQueryResult } from '../../commons/decorator';
import { NFT, NFTDocument } from './nft.schema';

@Injectable()
export class NFTService {
  private readonly logger = new Logger(NFTService.name);
  private readonly contractProvider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_URL,
  );
  private readonly nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;

  constructor(
    @InjectModel(NFT.name)
    private readonly nftModel: PaginateModel<NFTDocument>,
  ) {}

  async onApplicationBootstrap() {
    if (JSON.parse(process.env.SYNC_ENABLED)) {
      await this.cleanUp();
      await this.syncPreviousNFTs();
    }
    await this.handleNFTMintedEvent();
  }

  async cleanUp() {
    await this.nftModel.deleteMany({
      contract: {
        $ne: this.nftContractAddress,
      },
    });
  }

  async handleNFTMintedEvent() {
    this.logger.log('Subscribing to NFTMinted event...');
    const abi = [
      'event MintNFT(uint256, address, string, string, uint256, uint256)',
    ];
    const contract = new ethers.Contract(
      this.nftContractAddress,
      abi,
      this.contractProvider,
    );
    const onCollectionCreated = async (
      tokenId: BigNumber,
      owner: string,
      tokenURI: string,
      tokenName: string,
      collectionId: BigNumber,
      tokenPower: BigNumber,
    ) => {
      this.logger.log(
        `NFT minted: ${tokenId}, ${tokenName}, ${owner} ${tokenURI} ${collectionId}`,
      );
      await this.upsertNFT(
        tokenId,
        owner,
        tokenURI,
        tokenName,
        collectionId,
        tokenPower,
      );
    };
    contract.on('MintNFT', onCollectionCreated);
  }

  async syncPreviousNFTs() {
    this.logger.log('Syncing previous nfts...');
    const abi = [
      'event MintNFT(uint256, address, string, string, uint256, uint256)',
    ];
    const contract = new ethers.Contract(
      this.nftContractAddress,
      abi,
      this.contractProvider,
    );
    const events = await contract.queryFilter(
      'MintNFT',
      parseInt(process.env.NFT_CONTRACT_DEPLOYED_BLOCK, 10),
      'latest',
    );
    this.logger.log(`Found ${events.length} events, upserting...`);
    const promises = events.map((event) => {
      this.upsertNFT(
        event.args[0],
        event.args[1],
        event.args[2],
        event.args[3],
        event.args[4],
        event.args[5],
      );
    });
    this.logger.log(`Synced previous ${promises.length} nfts!`);
    return Promise.all(promises);
  }

  async upsertNFT(
    tokenId: BigNumber,
    owner: string,
    tokenURI: string,
    tokenName: string,
    collectionId: BigNumber,
    tokenPower: BigNumber,
  ) {
    return this.nftModel.findOneAndUpdate(
      {
        tokenId: tokenId.toString(),
      },
      {
        tokenId: tokenId.toString(),
        tokenURI,
        tokenName,
        owner,
        collectionId: collectionId.toString(),
        contract: this.nftContractAddress,
        creator: owner,
        tokenPower: tokenPower.toString(),
      },
      {
        upsert: true,
      },
    );
  }

  async getNFTs(findQuery: FindQueryResult) {
    const options: PaginateOptions = {
      ...findQuery.pagination,
      select: '-__v -_id',
      populate: {
        path: 'collectionInfo',
        select: '-__v -_id -owner -createdAt -updatedAt -contract',
      },
    };
    return this.nftModel.paginate(findQuery.filters, options);
  }

  async getNFT(tokenId: string) {
    const item = await this.nftModel
      .findOne({ tokenId })
      .select('-__v -_id')
      .populate('collectionInfo');
    if (!item) {
      throw new NotFoundException('NFT not found');
    }
    return item;
  }

  async getNftByField(field: string, value: string) {
    const collection = await this.nftModel.findOne({
      [field]: value,
    });
    if (!collection) {
      throw new NotFoundException('NFT not found');
    }
    return collection;
  }
}
