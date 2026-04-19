import { Component, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HandName } from '../../utils/card.util';

@Component({
  selector: 'app-top-admin-panel',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './top-admin-panel.html',
  styleUrl: './top-admin-panel.css',
})
export class TopAdminPanel {
  linesVulnerable = model.required<('NS' | 'WE')[]>();
  dealer = model.required<HandName>();
  number = model.required<number>();
  editMode = model.required<boolean>();

  onReset = output();
  onDealNew = output();

  isPanelHidden = signal<boolean>(false);

  changePanelVisibility() {
    this.isPanelHidden.set(!this.isPanelHidden());
  }
}
