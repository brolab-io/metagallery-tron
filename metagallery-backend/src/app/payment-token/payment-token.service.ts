import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ethers } from 'ethers';
import { PaginateModel, PaginateOptions } from 'mongoose';
import { FindQueryResult } from '../../commons/decorator';
import { PaymentToken, PaymentTokenDocument } from './payment-token.schema';

@Injectable()
export class PaymentTokenService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PaymentTokenService.name);
  private readonly contractProvider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_URL,
  );
  private readonly marketplaceContractAddress =
    process.env.MARKETPLACE_CONTRACT_ADDRESS;
  private readonly paymentTokenAddedEvent = 'paymentTokenAdded';
  private readonly paymentTokenAddedAbi = ['event paymentTokenAdded(address)'];

  constructor(
    @InjectModel(PaymentToken.name)
    private readonly paymentTokenModel: PaginateModel<PaymentTokenDocument>,
  ) {}

  async onApplicationBootstrap() {
    if (JSON.parse(process.env.SYNC_ENABLED)) {
      await this.cleanUp();
      await this.syncPreviousPaymentTokens();
    }
    await this.handlePaymentTokenAddedEvent();
  }

  async cleanUp() {
    await this.paymentTokenModel.deleteMany({
      contract: {
        $ne: this.marketplaceContractAddress,
      },
    });
  }

  async handlePaymentTokenAddedEvent() {
    this.logger.log('Subscribing to PaymentTokenAdded event...');
    const contract = new ethers.Contract(
      this.marketplaceContractAddress,
      this.paymentTokenAddedAbi,
      this.contractProvider,
    );
    const onPaymentTokenAdded = async (tokenAddress: string) => {
      this.logger.log(
        `PaymentTokenAdded event received! tokenAddress: ${tokenAddress}`,
      );
      await this.upsertPaymentToken(tokenAddress);
    };
    contract.on(this.paymentTokenAddedEvent, onPaymentTokenAdded);
  }

  async syncPreviousPaymentTokens() {
    this.logger.log('Syncing previous paymentTokens...');
    const contract = new ethers.Contract(
      this.marketplaceContractAddress,
      this.paymentTokenAddedAbi,
      this.contractProvider,
    );
    const events = await contract.queryFilter(
      this.paymentTokenAddedEvent,
      parseInt(process.env.NFT_CONTRACT_DEPLOYED_BLOCK, 10),
      'latest',
    );
    this.logger.log(`Found ${events.length} events, upserting...`);
    const promises = events.map((event) => {
      this.upsertPaymentToken(event.args[0]);
    });
    this.logger.log(`Synced previous ${promises.length} paymentTokens!`);
    return Promise.all(promises);
  }

  async upsertPaymentToken(tokenAddress: string) {
    const contract = new ethers.Contract(
      tokenAddress,
      [
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
      ],
      this.contractProvider,
    );
    const [tokenSymbol, tokenDecimals] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
    ]);
    return this.paymentTokenModel.findOneAndUpdate(
      {
        tokenAddress: tokenAddress.toString(),
      },
      {
        tokenAddress: tokenAddress.toString(),
        tokenSymbol,
        tokenDecimals,
        contract: this.marketplaceContractAddress,
      },
      {
        upsert: true,
      },
    );
  }

  async getPaymentTokens(findQuery: FindQueryResult) {
    const options: PaginateOptions = {
      ...findQuery.pagination,
      select: '-__v -_id',
    };
    return this.paymentTokenModel.paginate(findQuery.filters, options);
  }
}
