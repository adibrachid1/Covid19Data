import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { News } from './../news.model';
import { CovidServiceService } from './../covid-service.service';
import { User } from './../user.model';
import { Summary } from './../summary.model';
import { Subscription, SubscriptionLike } from 'rxjs';
import { ChartType, ChartOptions, ChartDataSets } from 'chart.js';
import { SingleDataSet, Label, monkeyPatchChartJsLegend, monkeyPatchChartJsTooltip, Color } from 'ng2-charts';
import {formatDate, getLocaleMonthNames} from '@angular/common';
import { AngularFirestore } from '@angular/fire/firestore';
@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.css']
})
export class CountryComponent implements OnInit {

  country: string;
  countrySlug: string;
  countryCode: string;

  //Pie Chart
  public pieChartOptions: ChartOptions = {responsive: true,};
  public pieChartLabels: Label[] = [['Dead Cases'], ['Recovered Cases'], 'Active Cases'];
  public pieChartData: SingleDataSet = [1, 1, 1];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [];

  //bar Chart 7 days
  public barChartOptions: ChartOptions = {responsive: true,};
  public barChartLabels: Label[] = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartDataSets[] = [];

  //all data linear
  public lineChartData: ChartDataSets[] = [];
  public lineChartLabels: Label[] = [];
  public lineChartOptions: ChartOptions = {
    responsive: true,
  };
  public lineChartColors: Color[] = [
    {
      borderColor: 'black',
      backgroundColor: 'rgba(255,0,0,0.3)',
    },
  ];
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [];

  user: User;
  description: string="";
  cases: {name: String, value: number}[]
  recovered: {name: String, value: number}[]
  deaths: {name: String, value: number}[]
  countries: {name: String, values: number[]}[]
  tableCountriesHead = ["New Cases","Total Cases","New Recoveries","Total Recoveries","New Deaths","Total Deaths"];
  summarySubscription: Subscription;
  summaryFromSubscription: Subscription;
  summary7daysSubscription: Subscription;
  countriesSubscription: Subscription;
  countrySubscription: Subscription;
  nbr_of_times = 0;
  nbr_of_times2 = 0;
  nbr_of_times3 = 0;
  news : News[]=[];
  superuser = false;
  constructor(public covidServiceService:CovidServiceService, public router: Router, private firestore: AngularFirestore) {
    monkeyPatchChartJsTooltip();
    monkeyPatchChartJsLegend();
   }
goHome(){
  this.router.navigate['home'];
}
  ngOnInit(): void {
    this.checkURI();
    this.user = this.covidServiceService.getUser();
    this.countriesSubscription = this.covidServiceService.countriesSubject.subscribe(
      (data: {name: string, values:number[]}[]) => {
        this.countries = data;
      }
    )
    this.countrySubscription = this.covidServiceService.countrySubject.subscribe(
      (data: string[]) => {
        this.country = data[0];
        this.countryCode = data[1];
        if(this.nbr_of_times2==0){
          this.checkFireStore();
          this.nbr_of_times2++;
        }
      }
    )
   this.summarySubscription = this.covidServiceService.summaryCountrySubject.subscribe(
    (data: {name: string, values:number[]}) => {
        if(data.values.length > 0){
          if(this.nbr_of_times3==0 && this.countrySlug==data.name){
          this.cases = []; this.recovered = []; this.deaths = []
          this.cases = [{name:"Total Cases",value:data.values[0]}, {name: "New Cases", value: data.values[1]}, {name: "Active Cases", value: data.values[2]}];
          this.recovered = [{name: "Total Recovered", value: data.values[3]}, {name: "New Recovered", value: data.values[4]}, {name: "Recovery Rate", value: data.values[5]}];
          this.deaths = [{name: "Total Deaths", value: data.values[6]}, {name: "New Deaths", value: data.values[7]}, {name: "Mortality Rate", value: data.values[8]}];
          //Prepare Pie

          //update DATABASE
          let new_summary : Summary = {
            date:new Date().toString(),
            TotalConfirmed: data.values[0].toString(),
            NewConfirmed: data.values[1].toString(),
            //active_case: data[2].toString(),
            TotalRecovered: data.values[3].toString(),
            NewRecovered: data.values[4].toString(),
            //recovery_rate: data[5].toString(),
            TotalDeaths: data.values[6].toString(),
            NewDeaths: data.values[7].toString()
            //mortality_rate: data[8].toString()
          }
          console.log("uploading to firestore")

            console.log("update "+this.countrySlug)
            this.resetPieChart([data.values[6], data.values[3], data.values[2]])
            console.log([data.values[6], data.values[3], data.values[2]])
            this.firestore.collection("summary").doc(this.countrySlug).set(new_summary);
            this.nbr_of_times3++;
          }
        }
    }
    );
    this.summary7daysSubscription = this.covidServiceService.summary7daysSubject.subscribe(
      (data7days: number[][]) => {
        this.barChartData = [];
        this.barChartData = [
          { data: data7days[0], label: 'Daily Deaths' },
          { data: data7days[1], label: 'Daily Recovered' },
          { data: data7days[2], label: 'Daily Cases' }
        ];
    }
    );
    this.summaryFromSubscription = this.covidServiceService.summaryFromSubject.subscribe(
      (dataFrom: number[][]) => {
        this.lineChartData = [];
          var today = (new Date()).toISOString().slice(0,10)
        for (var i=0;i<dataFrom[0].length;i++){
          //this.lineChartLabels.push(i.toString());
          this.lineChartLabels.push(("0"+new Date(dataFrom[3][i]).getDate()).slice(-2)+ " "+ this.getmonth(new Date(dataFrom[3][i]).getMonth()));

          //console.log(i.toString())
        }
        this.lineChartData = [
          { data: dataFrom[0], label: 'Total Deaths' },
          { data: dataFrom[1], label: 'Total Recovered' },
          { data: dataFrom[2], label: 'Total Cases' }
        ];
    }
    );
    //this.covidServiceService.getSummary(this.countrySlug);
    //7 days
    this.barChartLabels = [];
    var d = new Date();
    for (var i = 0; i < 7; i++) {
      this.barChartLabels.unshift(d.getDate()+' '+d.toLocaleString('en-us', { month: 'short' }));
      if(i == 6)
      continue;
      d.setDate(d.getDate()-1);
    }
    d.setDate(d.getDate()-1);
    var day0 = (d.toISOString().slice(0,10));
    var day7 = (new Date()).toISOString().slice(0,10);
    this.covidServiceService.getSummary7days(day0, day7, this.countrySlug);
    this.covidServiceService.getSummaryFrom(this.countrySlug);
    this.getNews()
    .subscribe((news: News[])=>{
      this.news = news;
      this.news.sort((a, b) => (a.date > b.date ? -1 : 1));
      console.log(this.news);
    });
    this.getSuperUsers()
    .subscribe((users: string[])=>{
      console.log(users)
      if (users == undefined){
        this.superuser=false;
      }else{
        this.superuser=true;
      }
      console.log(this.superuser)
    });
  }
  getSuperUsers(){
    return this.firestore.collection("super_users").doc(this.user.email).valueChanges();
  }
  getmonth(m){
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return months[m];
  }
  checkURI(){
    var href = this.router.url;
    if(href.split('/').length!=3){
      this.router.navigate(["home"]);
    }else{
      if(href.split('/')[2].length == 0){
        this.router.navigate(["home"]);
      }else{
        this.countrySlug = href.split('/')[2];
        this.covidServiceService.getCountry(this.countrySlug);
      }
    }
  }
  addNews(){
    let news: News = {
      date: new Date(),
      description: this .description,
      username: this.user.displayName,
      uid:this.user.uid,
      country: ''
    };
    this.firestore.collection("news").doc("news").collection(this.countrySlug).add(news);
    this.description ="";
  }
  getNews(){
    return this.firestore.collection("news").doc("news").
      collection(this.countrySlug).valueChanges();
  }
getSummaryData(country){
  console.log(country)
  return this.firestore.collection("summary").doc(country).valueChanges();
}
checkFireStore(){
  this.getSummaryData(this.countrySlug).subscribe((summary)=>{
    if(this.nbr_of_times==0){
    const today = new Date()
    if(summary == undefined){
      //get data and update database
        console.log("need to update db")
        this.covidServiceService.getSummaryCountry(this.countrySlug);
    }
    else{
      const last_update = new Date(summary["date"])
      if(last_update.getDate() == today.getDate() &&
      last_update.getMonth() == today.getMonth() &&
      last_update.getFullYear() == today.getFullYear()){//today already updated -- just bring from database
        this.cases = []; this.recovered = []; this.deaths = []
          this.cases = [{name:"Total Cases",value: +summary["TotalConfirmed"]}, {name: "New Cases", value: +summary["NewConfirmed"]}, {name: "Active Cases", value: (+summary["TotalConfirmed"])-(+summary["TotalRecovered"])}];
          this.recovered = [{name: "Total Recovered", value: +summary["TotalRecovered"]}, {name: "New Recovered", value: +summary["NewRecovered"]}, {name: "Recovery Rate", value: (+summary["TotalRecovered"])/(+summary["TotalConfirmed"])}];
          this.deaths = [{name: "Total Deaths", value: +summary["TotalDeaths"]}, {name: "New Deaths", value: +summary["NewDeaths"]}, {name: "Mortality Rate", value: (+summary["TotalDeaths"])/(+summary["TotalConfirmed"])}];
          this.resetPieChart([this.deaths[0].value,this.recovered[0].value,this.cases[0].value])
          console.log([this.deaths[0].value,this.recovered[0].value,this.cases[0].value])
          console.log("Summary from google firestore")
      }
      else{
        //get data and update database
        console.log("need to update db - not up to date")
        this.covidServiceService.getSummaryCountry(this.countrySlug);
      }
    }
  }
    this.nbr_of_times +=1;
  }
  )
}
resetPieChart(data){
  this.pieChartData=data;
}
sort_by_key_name(array, key, dir) //dir 0 desc
{
 return array.sort(function(a, b)
 {
  var x = a[key]; var y = b[key];
  if(dir)
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  else
  return ((x > y) ? -1 : ((x < y) ? 1 : 0));
 });
}

 sort_by_key_values(array, key, dir,index) //dir 0 desc
{
 return array.sort(function(a, b)
 {
  var x = a[key][index]; var y = b[key][index];
  if(dir)
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  else
  return ((x > y) ? -1 : ((x < y) ? 1 : 0));
 });
}

sort(direction,col){
  switch(col){
    case 'C':
      direction == 'up'? this.sort_by_key_name(this.countries,'name',1) : this.sort_by_key_name(this.countries,'name',0);
    break;
    case 'NC':
      direction == 'up'? this.sort_by_key_values(this.countries,'values',1,0) : this.sort_by_key_values(this.countries,'values',0,0);
    break;
    case 'TC':
      direction == 'up'? this.sort_by_key_values(this.countries,'values',1,1) : this.sort_by_key_values(this.countries,'values',0,1);
    break;
    case 'NR':
      direction == 'up'? this.sort_by_key_values(this.countries,'values',1,2) : this.sort_by_key_values(this.countries,'values',0,2);
    break;
    case 'TR':
      direction == 'up'? this.sort_by_key_values(this.countries,'values',1,3) : this.sort_by_key_values(this.countries,'values',0,3);
    break;
    case 'ND':
      direction == 'up'? this.sort_by_key_values(this.countries,'values',1,4) : this.sort_by_key_values(this.countries,'values',0,4);
    break;
    case 'TD':
      direction == 'up'? this.sort_by_key_values(this.countries,'values',1,5) : this.sort_by_key_values(this.countries,'values',0,5);
    break;
  }
}
}

