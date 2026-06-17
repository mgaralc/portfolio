import { Component, computed, effect, input, output, signal } from '@angular/core';
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

  // --- Mobile bottom-sheet drag/collapse -----------------------------------
  // On phones the panel is a bottom sheet. The grab strip at its top can be
  // dragged (follows the finger, springs to open/closed on release) or tapped
  // (toggles) so the visitor can slide the text down and see the 3D zone.
  readonly collapsed = signal(false);
  readonly dragging = signal(false);
  /** Current vertical offset of the sheet in px (0 = fully open). */
  readonly translateY = signal(0);

  private dragStartY = 0;
  private dragStartOffset = 0;
  private sheetHeight = 0;

  /** Inline transform applied only while dragging or collapsed. */
  readonly sheetTransform = computed(() =>
    this.dragging() || this.collapsed()
      ? `translateY(${this.translateY()}px)`
      : null
  );

  // Each time a new zone opens, start fully expanded.
  private readonly resetOnRoom = effect(() => {
    this.room();
    this.collapsed.set(false);
    this.dragging.set(false);
    this.translateY.set(0);
  });

  /** How far down the sheet slides when collapsed (leaves the grab strip). */
  private collapsedOffset(): number {
    return Math.max(this.sheetHeight - 56, 0);
  }

  onGrabDown(event: PointerEvent): void {
    const grab = event.currentTarget as HTMLElement;
    const sheet = grab.closest('.room-overlay') as HTMLElement | null;
    this.sheetHeight = sheet?.offsetHeight ?? 0;
    this.dragStartY = event.clientY;
    this.dragStartOffset = this.collapsed() ? this.collapsedOffset() : 0;
    this.translateY.set(this.dragStartOffset);
    this.dragging.set(true);
    grab.setPointerCapture(event.pointerId);
  }

  onGrabMove(event: PointerEvent): void {
    if (!this.dragging()) return;
    const dy = event.clientY - this.dragStartY;
    const next = Math.min(
      Math.max(this.dragStartOffset + dy, 0),
      this.collapsedOffset()
    );
    this.translateY.set(next);
  }

  onGrabUp(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    const moved = Math.abs(event.clientY - this.dragStartY);
    if (moved < 6) {
      // Treat as a tap: toggle open/closed.
      this.collapsed.update((c) => !c);
    } else {
      // Snap to whichever state is nearer.
      this.collapsed.set(this.translateY() > this.collapsedOffset() / 2);
    }
    this.translateY.set(this.collapsed() ? this.collapsedOffset() : 0);
  }

  onClose(): void {
    this.closed.emit();
  }
}
