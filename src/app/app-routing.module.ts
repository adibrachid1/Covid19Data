import { SecurePagesGuard } from './secure-pages.guard';
import { AuthGuard } from './auth.guard';
import { CountryComponent } from './country/country.component';
import { HomeComponent } from './home/home.component';
import { SigninComponent } from './signin/signin.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {path: "signin", component: SigninComponent, canActivate: [SecurePagesGuard]},
  {path: "home", component: HomeComponent, canActivate: [AuthGuard]},
  {path: "country",children:[{path: "**", component: CountryComponent, canActivate: [AuthGuard]}]},
  {path: "", pathMatch: "full", redirectTo: "signin"},
  {path: "**", redirectTo: "signin"}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
