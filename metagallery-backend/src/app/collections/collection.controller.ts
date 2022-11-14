import { Controller, Get, Param } from '@nestjs/common';
import { FindQuery, FindQueryResult } from '../../commons/decorator';
import { CollectionService } from './collection.service';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  async getCollections(@FindQuery() findQuery: FindQueryResult) {
    return await this.collectionService.getCollections(findQuery);
  }

  @Get('/:field/:value')
  getCollectionByField(
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return this.collectionService.getCollectionByField(field, value);
  }
}
