import { Component, computed, input, output } from '@angular/core';
import type { Room } from '../rooms/room.model';

@Component({
  selector: 'app-room-overlay',
  templateUrl: './room-overlay.component.html',
  styleUrl: './room-overlay.component.scss',
})
export class RoomOverlayComponent {
  readonly room = input<Room | null>(null);
  readonly closed = output<void>();

  /** The active zone's color as a CSS hex, used to theme the whole panel. */
  readonly accent = computed(() => {
    const room = this.room();
    return room
      ? '#' + room.color.toString(16).padStart(6, '0')
      : '#6db8ff';
  });

  onClose(): void {
    this.closed.emit();
  }
}
