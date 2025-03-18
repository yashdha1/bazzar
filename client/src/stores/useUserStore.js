// maintains a Global store for all the User related activities :-  

import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
    user: null, 
    checkingAuth: true,
    loading: false, 

    signup : async ({username, email , password, confirmPassword }) => {
        set({loading: true}); // start thy loading.... 
        if(password !== confirmPassword){
            set({loading: false}); // stop the Loading and return the error:  
            return toast.error("Passwords do not match");
        }
        try {
            const res = await axios.post("/auth/signup", {username, email, password}); 
            set({user: res.data.user , loading: false});
            console.log(res);
            toast.success("Signed Up Successfully");
        } catch (error) {
            set({loading: false}); // stop the Loading and return the error:
            console.log(error); 
            toast.error(error.response.data.error);
        }
    },
    login : async ({email, password}) => {
        set({loading: true}); // start thy loading.... 
        try {
            const res = await axios.post("/auth/login", { email, password }); 
            console.log(res)
            set({user: res.data.user , loading: false}); // finish Loading 
            console.log(res);
            toast.success("Logged in, Successfully");
        } catch (error) {
            set({loading: false}); // stop the Loading and return the error:
            console.log(error); 
            toast.error(error.response.data.error);
        }
    },
    checkAuth: async () => {
        set({checkingAuth: true});
        try {
            const res = await axios.get("/auth/profile");
            set({user: res.data.user , checkingAuth: false});
        } catch (error) {
          set({ checkingAuth: false , user: null});   
        }
    }, 
    logout: async () => {
        try {
            await axios.post("/auth/logout") ;
            set({user: null}); 
            toast.success("Logged Out Successfully");
        } catch (error) {
            toast.error(error.response.data.error || "Error Occured Durinng LOGOUT.")
        }
    },
}));

// TODO : Implement the axios Interceptors to refresh the Access Tokens:  15mins