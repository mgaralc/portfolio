import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { SceneEngine } from '../scene/scene-engine';
import { ROOMS } from '../rooms/rooms.data';
import type { Room } from '../rooms/room.model';
import { RoomOverlayComponent } from '../room-overlay/room-overlay.component';

@Component({
  selector: 'app-scene-host',
  imports: [RoomOverlayComponent],
  templateUrl: './scene-host.component.html',
  styleUrl: './scene-host.component.scss',
  host: {
    '(window:keydown.escape)': 'closeRoom()',
  },
})
export class SceneHostComponent implements AfterViewInit, OnDestroy {
  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');
  private readonly ngZone = inject(NgZone);
  private engine: SceneEngine | null = null;

  readonly focusedRoom = signal<Room | null>(null);

  async ngAfterViewInit(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;

    await this.ngZone.runOutsideAngular(() => {
      this.engine = new SceneEngine(canvas, ROOMS, {
        onRoomSelected: (room) =>
          this.ngZone.run(() => this.focusedRoom.set(room)),
        onOrbitRestored: () =>
          this.ngZone.run(() => this.focusedRoom.set(null)),
      });
      return this.engine.init();
    });
  }

  closeRoom(): void {
    if (!this.focusedRoom()) return;
    this.engine?.returnToOrbit();
  }

  ngOnDestroy(): void {
    this.engine?.dispose();
  }
}
