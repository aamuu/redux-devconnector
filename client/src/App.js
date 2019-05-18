import React from "react";
import NavBar from "./components/layout/NavBar";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Landing from "./components/layout/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import "./App.css";

const App = () =>
  <><Router>
    <NavBar/>
    <Route exact path="/" component={Landing}/>
    <section className="container">
      <Switch>
        <Route exact path="/login" component={Login}/>
        <Route exact path="/register" component={Register}/>
      </Switch>
    </section>
  </Router>
  </>;
export default App;
