import mongoose from "mongoose" ;
import jwt from 'jsonwebtoken' ; 
import bcrypt from 'bcrypt' ; 

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'], 
        unique: true
    }, 
    email: {
        type: String,
        required: [true, 'Please add a Email.'], 
        unique: true, 
        lowercase: true, 
        trim : true
    }, 
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters.'],
        unique: true
    }, 
    cartItems: [{
        quantity: {
            type: Number,
            default: 1
        }, 
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product' // this is a reference to the product model
        }
    }
],
role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
}
},{
    // createdAt : UpdatedAt ;
    timestamps: true, 
}
)
// password encryption - JWT and BCRYPT; 

// pre-save hoot to hash passwordto save at the database;  
userSchema.pre('save' , async function(next){
    if(!this.isModified('password')) {
        next() ;
    }
    const salt = await bcrypt.genSalt(10) ; // generate SALT:
    this.password = await bcrypt.hash(this.password, salt) ;
    next();// ensure that we move to the next middleware function
})
// Creating the User methods to compare passwords; 
userSchema.methods.comparePassword = async function(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password); 
}



const User = mongoose.model('User', userSchema) ; 
export default User; 