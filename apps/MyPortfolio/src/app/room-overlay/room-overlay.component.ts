import { Component, input, output } from '@angular/core';
import type { Room } from '../rooms/room.model';

@Component({
  selector: 'app-room-overlay',
  templateUrl: './room-overlay.component.html',
  styleUrl: './room-overlay.component.scss',
})
export class RoomOverlayComponent {
  readonly room = input<Room | null>(null);
  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
