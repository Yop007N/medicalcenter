import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private loadingCount = 0;

  show(): void {
    this.loadingCount++;
    this.loadingSubject.next(true);
  }

  hide(): void {
    if (this.loadingCount > 0) {
      this.loadingCount--;
      if (this.loadingCount === 0) {
        this.loadingSubject.next(false);
      }
    }
  }
}
