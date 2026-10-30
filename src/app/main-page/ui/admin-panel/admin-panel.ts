import { Component, input, model, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { HandName, Suit, SuitSymbolMap, suitDisplayOrder } from '../../utils/card.util';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-admin-panel',
  imports: [
    MatTabsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './admin-panel.html',
})
export class AdminPanel {
  linesVulnerable = model.required<('NS' | 'WE')[]>();
  dealer = model.required<HandName>();
  number = model.required<number>();
  editMode = model.required<boolean>();
  binCount = input.required<number>();
  binnedSuits = input.required<Suit[]>();

  undoBid = output();
  resetBidding = output();
  undoCard = output();
  undoTrick = output();
  resetPlayedCards = output();
  dealerChanged = output();
  dealNewRequested = output();
  restoreBin = output();
  suitBinToggled = output<Suit>();

  readonly suits = suitDisplayOrder();
  readonly suitSymbols = SuitSymbolMap;

  isPanelHidden = signal<boolean>(false);

  changePanelVisibility() {
    this.isPanelHidden.set(!this.isPanelHidden());
  }
}
