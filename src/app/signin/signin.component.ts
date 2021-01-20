import { CovidServiceService } from './../covid-service.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {

  constructor(public covidServiceService: CovidServiceService) { }

  ngOnInit(): void {
  }

}
