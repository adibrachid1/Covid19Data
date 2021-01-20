export class Summary{
  date: string;
  TotalConfirmed: string;
  NewConfirmed: string;
  //active_case: string;
  TotalRecovered: string;
  NewRecovered: string;
  //recovery_rate: string;
  TotalDeaths: string;
  NewDeaths: string;
  //mortality_rate: string;

  constructor(  date: string, TotalConfirmed: string, NewConfirmed: string, TotalRecovered: string, NewRecovered: string, TotalDeaths: string, NewDeaths: string){
      this.date = date;
      this.TotalConfirmed = TotalConfirmed;
      this.NewConfirmed = NewConfirmed;
      //this.active_case = active_case;
      this.TotalRecovered = TotalRecovered;
      this.NewRecovered = NewRecovered;
      //this.recovery_rate = recovery_rate;
      this.TotalDeaths = TotalDeaths;
      this.NewDeaths = NewDeaths;
      //this.mortality_rate = mortality_rate;
  }
}
