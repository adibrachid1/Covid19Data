import { News } from './../news.model';
import { Summary } from './../summary.model';
import { CovidServiceService } from './../covid-service.service';
import { User } from './../user.model';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Subscription, SubscriptionLike } from 'rxjs';
import { ChartType, ChartOptions, ChartDataSets } from 'chart.js';
import { AngularFirestore } from '@angular/fire/firestore';
import {MatSelectModule} from '@angular/material/select';
import { SingleDataSet, Label, monkeyPatchChartJsLegend, monkeyPatchChartJsTooltip, Color } from 'ng2-charts';
interface Food {
  value: string;
  viewValue: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

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
    /*{ data: [65, 59, 80, 81, 56, 55, 40], label: 'Total Deaths' },
    { data: [65, 59, 80, 81, 56, 50, 40], label: 'Total Recovered' },
    { data: [10, 20, 35, 50, 56, 60, 80], label: 'Total Cases' }
  ];*/
  public lineChartLabels: Label[] = [];
  //['January', 'February', 'March', 'April', 'May', 'June', 'July'];
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
  foods: Food[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'}
  ];
  user: User;
  description: string="";
  cases: {name: String, value: number}[]
  recovered: {name: String, value: number}[]
  deaths: {name: String, value: number}[]
  countries: {name: String, values: number[]}[] =[]
  countriesAdded: {name: String, values: number[]}[]
  tableCountriesHead = ["New Cases","Total Cases","New Recoveries","Total Recoveries","New Deaths","Total Deaths"];
  summarySubscription: Subscription;
  summaryFromSubscription: Subscription;
  summary7daysSubscription: Subscription;
  countriesSubscription: Subscription;
  summary: Summary;
  superuser = false;
  nbr_of_times = 0;
  nbr_of_times2 = 0;
  news_country = 'world';
  news : News[]=[];
  constructor(public covidServiceService:CovidServiceService, private router: Router, private firestore: AngularFirestore) {
    monkeyPatchChartJsTooltip();
    monkeyPatchChartJsLegend();
   }

  ngOnInit(): void {
    this.user = this.covidServiceService.getUser();
    this.countriesSubscription = this.covidServiceService.countriesSubject.subscribe(
      (data: {name: string, values:number[]}[]) => {
        this.countries = data;
      }
    )
   this.summarySubscription = this.covidServiceService.summarySubject.subscribe(
      (data: number[]) => {
        if(data.length > 0){
          this.cases = []; this.recovered = []; this.deaths = []
          this.cases = [{name:"Total Cases",value:data[0]}, {name: "New Cases", value: data[1]}, {name: "Active Cases", value: data[2]}];
          this.recovered = [{name: "Total Recovered", value: data[3]}, {name: "New Recovered", value: data[4]}, {name: "Recovery Rate", value: data[5]}];
          this.deaths = [{name: "Total Deaths", value: data[6]}, {name: "New Deaths", value: data[7]}, {name: "Mortality Rate", value: data[8]}];
          //Prepare Pie
          this.resetPieChart([data[6], data[3], data[2]])
          //update DATABASE
          let new_summary : Summary = {
            date:new Date().toString(),
            TotalConfirmed: data[0].toString(),
            NewConfirmed: data[1].toString(),
            //active_case: data[2].toString(),
            TotalRecovered: data[3].toString(),
            NewRecovered: data[4].toString(),
            //recovery_rate: data[5].toString(),
            TotalDeaths: data[6].toString(),
            NewDeaths: data[7].toString(),
            //mortality_rate: data[8].toString()
          }
          console.log("uploading to firestore")
          if(this.nbr_of_times2==0){
           console.log('world')
            this.firestore.collection("summary").doc("world").set(new_summary);
           this.nbr_of_times2++;}
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
// TO DESABLE ============================================
    //this.covidServiceService.getSummary();
    this.covidServiceService.getCountries();
    //7 days
    this.barChartLabels = [];
    var d = new Date();
    for (var i = 0; i < 7; i++) {
      this.barChartLabels.unshift(d.getDate()+' '+d.toLocaleString('en-us', { month: 'short' }));
      if(i == 6)
      continue;
      d.setDate(d.getDate()-1);
    }

    this.getSummaryData("world").subscribe((summary)=>{
      if(this.nbr_of_times==0){
      const today = new Date()
      if(summary == undefined){
        //get data and update database
          console.log("need to update db")
          this.covidServiceService.getSummary();
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
            console.log("Summary from google firestore")
        }
        else{
          //get data and update database
          console.log("need to update db - not up to date")
          this.covidServiceService.getSummary();
        }
      }
    }
      this.nbr_of_times +=1;
    }
    )
    var day1 = (d.toISOString().slice(0,10));
    var day7 = (new Date()).toISOString().slice(0,10);
    this.covidServiceService.getSummary7days(day1, day7);
    this.covidServiceService.getSummaryFrom();
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
  getmonth(m){
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return months[m];
  }
getSummaryData(country){
  return this.firestore.collection("summary").doc(country).valueChanges();
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
changeNewsCountry(country){
this.news_country = country;
}
addNews(){
  let news: News = {
    date: new Date(),
    description: this .description,
    username: this.user.displayName,
    uid:this.user.uid,
    country: this.news_country
  };
  this.firestore.collection("news").doc("news").collection(this.news_country).add(news);
  this.description ="";
}
getNews(){
  return this.firestore.collection("news").doc("news").
    collection("world").valueChanges();
}
getSuperUsers(){
  return this.firestore.collection("super_users").doc(this.user.email).valueChanges();
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
go_to_country(country){
  this.router.navigate(["country/"+country]);
}
}
