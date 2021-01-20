import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { User } from './user.model';
import { Subject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CovidServiceService {

  private user: User
  backendURL = 'https://api.covid19api.com';
  summarySubject = new Subject<number[]>();
  summaryCountrySubject = new Subject<{name: string, values:number[]}>();
  summary7daysSubject = new Subject<number[][]>();
  summaryFromSubject = new Subject<number[][]>();
  countriesSubject = new Subject<{name: string, values:number[]}[]>();
  countrySubject = new Subject<string[]>();
  countriesData: {name: string, values:number[]}[] = [];
  summary : number[]= [];
  summary7days : number[][]= [[],[],[]];
  summaryFrom : number[][]= [[],[],[],[]];
  constructor(private afAuth: AngularFireAuth, private router: Router, private firestore: AngularFirestore, private httpClient: HttpClient) { }

  async signInWithGoogle(){
    const credentials = await this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    this.user ={
      uid:credentials.user.uid,
      displayName: credentials.user.displayName,
      email: credentials.user.email
    };
    localStorage.setItem("user",JSON.stringify(this.user));
    this.updateUserData( );
    this.router.navigate(["home"]);
  }
  private updateUserData(){
    this.firestore.collection("users").doc(this.user.uid).set({
      uid: this.user.uid,
      displayName: this.user.displayName,
      email: this.user.email
    },{merge: true});
  }
  getUser(){
    if(this.user == null && this.userSignedIn()){
      this.user = JSON.parse(localStorage.getItem("user"))
    }
    return this.user;
  }
  userSignedIn(): boolean{
    return JSON.parse(localStorage.getItem("user")) != null;
  }
  public signOut(){
    this.afAuth.signOut();
    localStorage.removeItem("user");
    this.user = null;
    this.router.navigate(["signin"]);
  }

  public getCountries(){
    this.countriesData = []
    this.httpClient
    .get<any[]>(this.backendURL + '/summary')
      .subscribe(
        (response) => {
          //last table each country
          for (const country of response["Countries"]){
            this.countriesData.push({name: country["Country"], values:[country["NewConfirmed"],country["TotalConfirmed"],country["NewRecovered"],country["TotalRecovered"],country["NewDeaths"],country["TotalDeaths"],country["Slug"]]});
          }
          this.countriesSubject.next(this.countriesData);
        },
        (error: any) => {
          console.log(error);
          return;
        }
    );
  }
  public getSummary(country='all'){
    this.summary = [];
    console.log(country)
    this.httpClient
      .get<any[]>(this.backendURL + '/summary')
      .subscribe(
        (response) => {
          //First table global summary
          this.summary[0]=response["Global"]["TotalConfirmed"];
          this.summary[1]=response["Global"]["NewConfirmed"];
          this.summary[3]=response["Global"]["TotalRecovered"];
          this.summary[4]=response["Global"]["NewRecovered"];
          this.summary[5]=this.summary[3]/this.summary[0];
          this.summary[6]=response["Global"]["TotalDeaths"];
          this.summary[7]=response["Global"]["NewDeaths"];
          this.summary[8]=this.summary[6]/this.summary[0];
          this.summary[2]=this.summary[0]-this.summary[3];
          this.summarySubject.next(this.summary);
          return;
        },
        (error: any) => {
          console.log(error);
          return;
        }
    );
  }
  public getSummaryCountry(country='all'){
    this.summary = [];
    console.log(country)
    this.httpClient
      .get<any[]>(this.backendURL + '/summary')
      .subscribe(
        (response) => {
          for (const d of response["Countries"]){
            if(d["Slug"] == country){
              this.summary[0]=d["TotalConfirmed"];
              this.summary[1]=d["NewConfirmed"];
              this.summary[3]=d["TotalRecovered"];
              this.summary[4]=d["NewRecovered"];
              this.summary[5]=this.summary[3]/this.summary[0];
              this.summary[6]=d["TotalDeaths"];
              this.summary[7]=d["NewDeaths"];
              this.summary[8]=this.summary[6]/this.summary[0];
              this.summary[2]=this.summary[0]-this.summary[3];
              console.log(this.summary);
              this.summaryCountrySubject.next({name:country, values: this.summary});
              return;
            }
          }
        },
        (error: any) => {
          console.log(error);
          return;
        }
    );
  }
  /*public getSummary(country='all'){
    this.summary = [];
    console.log(country)
    this.httpClient
      .get<any[]>(this.backendURL + '/summary')
      .subscribe(
        (response) => {
          if(country=='all'){
          //First table global summary
          this.summary[0]=response["Global"]["TotalConfirmed"];
          this.summary[1]=response["Global"]["NewConfirmed"];
          this.summary[3]=response["Global"]["TotalRecovered"];
          this.summary[4]=response["Global"]["NewRecovered"];
          this.summary[5]=this.summary[3]/this.summary[0];
          this.summary[6]=response["Global"]["TotalDeaths"];
          this.summary[7]=response["Global"]["NewDeaths"];
          this.summary[8]=this.summary[6]/this.summary[0];
          this.summary[2]=this.summary[0]-this.summary[3];
          this.summarySubject.next(this.summary);
          return;
        }else{
          for (const d of response["Countries"]){
            if(d["Slug"] == country){
              console.log(d)
              this.summary[0]=d["TotalConfirmed"];
              this.summary[1]=d["NewConfirmed"];
              this.summary[3]=d["TotalRecovered"];
              this.summary[4]=d["NewRecovered"];
              this.summary[5]=this.summary[3]/this.summary[0];
              this.summary[6]=d["TotalDeaths"];
              this.summary[7]=d["NewDeaths"];
              this.summary[8]=this.summary[6]/this.summary[0];
              this.summary[2]=this.summary[0]-this.summary[3];
              console.log(this.summary);
              this.summarySubject.next(this.summary);
              return;
            }
          }
        }
        },
        (error: any) => {
          console.log(error);
          return;
        }
    );
  }*/
  sort_by_key_name(array, key)
  {
  return array.sort(function(a, b)
  {
    var x = a[key]; var y = b[key];
    return ((x < y) ) ? -1 : (((x > y) ? 1 : 0));
  });
  }
  public getSummary7days(day1,day7, countrySlug='all'){
    //test
    //day1 = '2020-10-29';
    //day7 = '2020-11-05';
    //day1 = '2020-10-27';
    //day7 = '2020-11-03';
    this.summary7days = [[],[],[]];
    if(countrySlug=='all'){
    this.httpClient
      .get<any[]>(this.backendURL + '/world?from=' + day1 + '&to=' + day7)
      .subscribe(
        (response) => {
          //console.log(response);
          if(response!=null){
          //sort data to be consistent
          this.sort_by_key_name(response,"TotalConfirmed");
          for (const d of response){
            this.summary7days[0].push(d["NewDeaths"]);
            this.summary7days[1].push(d["NewRecovered"]);
            this.summary7days[2].push(d["NewConfirmed"]);
          }
          this.summary7daysSubject.next(this.summary7days);
          return;
        }
        },
        (error: any) => {
          console.log(error);
          return;
        }
    );
      }
      else{
        this.httpClient
      //.get<any[]>(this.backendURL + '/country/'+countrySlug+'/status/confirmed?from=' + day1 + '&to=' + day7)
      .get<any[]>(this.backendURL + '/total/country/'+countrySlug+'?from=' + day1 + '&to=' + day7)
      .subscribe(
        (response) => {
          console.log(this.backendURL + '/total/country/'+countrySlug+'?from=' + day1 + '&to=' + day7)
          //sort data to be consistent
          this.sort_by_key_name(response,"Date");
          var i=0;var a;
          for (const d of response){
            //if(d["Province"] == ""){
              if(i!=0){
                this.summary7days[0].push(d["Deaths"] -a["Deaths"]);
                this.summary7days[1].push(d["Recovered"] - a["Recovered"]);
                this.summary7days[2].push(d["Confirmed"] - a["Confirmed"]);
              }
              a = d
              if(i==0){i=i+1; continue;}
          //}
          }
          this.summary7daysSubject.next(this.summary7days);
        },
        (error: any) => {
          console.log(error);
          return;
        }
    );
      }
  }
  public getCountry(countrySlug: string){
    this.httpClient
      .get<any[]>(this.backendURL + '/countries')
      .subscribe(
        (response) => {
          console.log(response)
          for (const d of response){
            if(d["Slug"] == countrySlug){
              this.countrySubject.next([d["Country"],d["ISO2"]]);
              return;
            }
          }
          this.router.navigate(["home"]);
          return;
        },
        (error: any) => {
          console.log(error);
          return;
        }
    );
  }
  public getSummaryFrom(countrySlug='all', day1 = '2020-04-13'){
    this.summaryFrom[0]=[];this.summaryFrom[1]=[];this.summaryFrom[2]=[];this.summaryFrom[3]=[];
    var today = (new Date()).toISOString().slice(0,10)
    if(countrySlug == 'all'){
      this.httpClient
        .get<any[]>(this.backendURL + '/world?from=' + day1 + '&to=' + today)
        .subscribe(
          (response) => {
            this.sort_by_key_name(response,"TotalConfirmed");
            for (const d of response){
              //console.log(d)
              this.summaryFrom[0].push(d["TotalDeaths"]);
              this.summaryFrom[1].push(d["TotalRecovered"]);
              this.summaryFrom[2].push(d["TotalConfirmed"]);
            }
            this.summaryFromSubject.next(this.summaryFrom);
            return;
          },
          (error: any) => {
            console.log(error);
            return;
          }
      );}
    else{
      this.httpClient
      //.get<any[]>(this.backendURL + '/country/'+countrySlug+'/status/confirmed?from=' + day1 + '&to=' + day7)
      .get<any[]>(this.backendURL + '/total/country/'+countrySlug+'?from=' + day1 + '&to=' + today)
      .subscribe(
        (response) => {
          //sort data to be consistent
          this.sort_by_key_name(response,"TotalConfirmed");
          for (const d of response){
            this.summaryFrom[0].push(d["Deaths"]);
            this.summaryFrom[1].push(d["Recovered"]);
            this.summaryFrom[2].push(d["Confirmed"]);
            this.summaryFrom[3].push(d["Date"]);
          }
          this.summaryFromSubject.next(this.summaryFrom);
        },
        (error: any) => {
          console.log(error);
          return;
        }
      );
    }
  }

}
