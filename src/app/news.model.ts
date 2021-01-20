

export class News{
  date: Date;
  description: string;
  username:string;
  uid: string;
  country: string;


  constructor(  date: Date,
    description: string,
    uid: string,
    country: string,username:string){
      this.date = date;
      this.description = description;
      this.uid = uid;
      this.country = country;
      this.username = username;
  }
}
