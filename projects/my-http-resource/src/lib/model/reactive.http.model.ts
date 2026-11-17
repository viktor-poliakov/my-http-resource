import { signal, WritableSignal } from '@angular/core';

export class ReactiveHttpModel<T> {
  public value: WritableSignal<T | null>;
  public loading: WritableSignal<boolean> = signal(false);
  public error: WritableSignal<unknown> = signal(null);

  constructor(initialValue?: T) {
    this.value = signal<T | null>(initialValue ?? null);
  }
}
