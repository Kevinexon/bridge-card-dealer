import { Component, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-admin-panel',
  imports: [MatIconModule, MatButtonModule, MatDividerModule],
  templateUrl: './bottom-admin-panel.html',
  styleUrl: './bottom-admin-panel.css',
})
export class BottomAdminPanel {
  undoBid = output();
  resetBidding = output();
  undoCard = output();
  undoTrick = output();
  resetPlayedCards = output();

  isPanelHidden = signal<boolean>(false);

  changePanelVisibility() {
    this.isPanelHidden.set(!this.isPanelHidden());
  }
}
