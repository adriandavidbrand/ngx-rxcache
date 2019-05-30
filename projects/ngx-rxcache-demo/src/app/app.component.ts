import { Component } from '@angular/core';

import { Service } from './service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  constructor(private service: Service) {}

  loading$ = this.service.loading$;
  saving$ = this.service.saving$;
  items$ = this.service.items$;
  error$ = this.service.error$;
  message$ = this.service.message$;

  text = 'added text';

  update() {
    this.service.update(['Item 5', 'Item 6', 'Item 7', 'Item 8']);
  }

  save() {
    this.service.save();
  }

  clear() {
    this.service.clear();
  }

  refresh() {
    this.service.refresh();
  }

  reload() {
    this.service.reload();
  }

  error() {
    this.service.error();
  }

  add() {
    if (this.text) {
      this.service.add(this.text);
    }
  }
}
