import React from 'react';
import {BrowserRouter as Router,Routes,Route} from "react-router-dom";

import Front from '../pages/Front';
import SignupInvestigator from '../pages/InvestigatorSignup';
import LoginInvestigator from '../pages/InvestigatorLogin';
import LoginUser from '../pages/UserLogin';
import SignupUser from '../pages/UserSignup';
import LoginAdmin from '../pages/AdminLogin';
import SignupAdmin from '../pages/AdminSignup';
import ProfileInvestigator from '../pages/InvestigatorProfile';
import ProfileUser from '../pages/UserProfile';
import InvestigatorHome from '../pages/Investigatorhome';
import UserHome from '../pages/UserHome';
import AdminHome from '../pages/AdminHome';
import FrontPage from '../pages/FrontPage';
import Fir from '../pages/UserFir';
import UserPending from '../pages/UserPending';
import UserActive from '../pages/UserActive';
import UserRejected from '../pages/UserRejected';
import UserSolved from '../pages/UserSolved';
import NewFir from '../pages/NewFir';
import SolvedFir from '../pages/SolvedFir';
import RunningFir from '../pages/RunningFir';
import Feedback from '../pages/UserFeedback';
import Contact from '../pages/UserContact';
import About from '../pages/about';
import ImageTester from '../pages/image';

// import Mycases from '../pages/mycases';
// import Completecases from '../pages/completecases';
// import CurrnetCase from '../pages/currentcase';


export default function Menuroutes() {
    return (
      <Router>
        <Routes>
          {/*  */}
          <Route path="/" element={<Front/>} />
          <Route path="/User/Login" element={<LoginUser/>} />
          <Route path="/User/Signup" element={<SignupUser />} />
          <Route path="/Investigator/Signup" element={<SignupInvestigator />} />    
          <Route path="/Investigator/Login" element={<LoginInvestigator />} />  
          <Route path="/Admin/Login" element={<LoginAdmin/>} />
          <Route path="/Admin/Signup" element={<SignupAdmin/>} />
          <Route path="/Investigator/Profile" element={<ProfileInvestigator />} />
          <Route path="/User/Profile" element={<ProfileUser />} />  
          <Route path="/Investigator/Home" element={<InvestigatorHome />} />    
          <Route path="/User/Home" element={<UserHome />} />     
          <Route path="/Admin/Home" element={<AdminHome />} />     
          <Route path="/FrontPage" element={<FrontPage />} /> 
          <Route path="/User/Fir" element={<Fir />} /> 
          <Route path="/User/Pending/Fir" element={<UserPending />} />     
          <Route path="/User/Active/Fir" element={<UserActive />} />     
          <Route path="/User/Solved/Fir" element={<UserSolved />} /> 
          <Route path="/User/Rejected/Fir" element={<UserRejected />} /> 
          <Route path="/Investigator/PendingFir" element={<NewFir />} />    
          <Route path="/Investigator/SolvedFir" element={<SolvedFir />} />    
          <Route path="/Investigator/RunningFir" element={<RunningFir />} />    
          <Route path="/User/Feedback" element={<Feedback />} />
          <Route path="/User/Contact" element={<Contact />} />
          <Route path="/About" element={<About />} /> 
          <Route path="/Image" element={<ImageTester />} />
          
          {/* 
          <Route path="/Currentcase" element={<CurrnetCase />} />
          <Route path="/Completecases" element={<Completecases />} />
          <Route path="/Mycases" element={<Mycases />} />
         */}
          
        </Routes>
      </Router>
    );
  }
  