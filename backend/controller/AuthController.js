import { Auth } from "../models/AuthModel";

export const registerUser = async(req,res) => {

} 

export const loginUser = async(req,res) => {
 try{

 } catch(err) {
    res.status(500).json({
        message: 'Invalid login',
        error: err,
    })
 }
}