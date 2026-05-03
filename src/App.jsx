
import './App.css'
import {Route,Routes} from 'react-router-dom';
import Home from "./Pages/Home.jsx"
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";


function App() {
      return (
          <div>

            <Routes>
                <Route path="/"  element={<Home/>} />
                <Route path="/login"  element={<Login/>} />
                <Route path="/register"  element={<Register/>} />
            </Routes>
          </div>
      );
}



export default App;
