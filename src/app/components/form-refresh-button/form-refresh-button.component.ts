import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faArrowRotateRight } from "@fortawesome/free-solid-svg-icons";
import { NgClass } from "@angular/common";

@Component({
  selector: 'form-refresh-button',
  standalone: true,
  imports: [FontAwesomeModule, NgClass],
  templateUrl: './form-refresh-button.component.html',
  styleUrl: './form-refresh-button.component.scss'
})
export class FormRefreshButtonComponent {
  //
  // Icons
  faArrowRotateRight = faArrowRotateRight;
  //
  // Inputs
  @Input({ required: true }) disabled: boolean = false;
  @Input({ required: true }) loading: boolean = false;
  

  constructor() {}
}
