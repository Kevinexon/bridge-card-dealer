import { Component } from '@angular/core';
import { Board } from '../../ui/board/board';
import { Hand } from '../../ui/hand/hand';
import { Bidding } from '../../ui/bidding/bidding';
import { TableService } from '../../utils/table-service';

@Component({
  selector: 'app-table',
  imports: [Board, Hand, Bidding],
  providers: [TableService],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table {}
