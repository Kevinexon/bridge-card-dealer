import { Component } from '@angular/core';
import { Hand } from '../../ui/hand/hand';
import { Bidding } from '../../ui/bidding/bidding';
import { TableService } from '../../utils/table-service';

@Component({
  selector: 'app-table',
  imports: [Hand, Bidding],
  providers: [TableService],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table {}
