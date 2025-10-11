import { Route} from 'react-router-dom';
import { Navigate } from "react-router-dom";
import Cookies from 'js-cookie';

// ✅ And update usage like this:
 


const ProtectedRoutes =()=>{
   const jwtToken=Cookies.get("jwt_token");
   if(jwtToken===undefined){
    <Navigate to="/facultylogin" replace />
   }
   else {
     return <Route {...props}/>
   }
}

export default ProtectedRoutes;