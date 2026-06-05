import { Component, inject, model, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Bidding } from '../../utils/bidding.util';

@Component({
  selector: 'app-alert-info-dialog',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  templateUrl: './alert-info-dialog.html',
})
export class AlertInfoDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<AlertInfoDialog>);
  readonly data = inject<Bidding>(MAT_DIALOG_DATA);
  readonly alertInfo = model('');

  ngOnInit(): void {
    this.alertInfo.set(this.data.alertInfo || '');
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
