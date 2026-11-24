const jwt=require('jsonwebtoken');const {pool}=require('../config/db');
async function protect(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return res.status(401).json({message:'Not authorized, no token'});const d=jwt.verify(h.slice(7),process.env.JWT_SECRET);const [rows]=await pool.query('SELECT id,name,username,role,department FROM users WHERE id=?',[d.id]);if(!rows.length)return res.status(401).json({message:'User not found'});req.user=rows[0];next();}catch(e){res.status(401).json({message:'Not authorized, token failed'});}}
const admin=(req,res,next)=>req.user?.role==='Admin'?next():res.status(403).json({message:'Admin access required'});
const teacher=(req,res,next)=>['Admin','Teacher'].includes(req.user?.role)?next():res.status(403).json({message:'Teacher or admin access required'});
module.exports={protect,admin,teacher};
