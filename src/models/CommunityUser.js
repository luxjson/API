const {pool}=require('../config/database');
class CommunityUser{
 static async findByUsername(username){const r=await pool.query(`SELECT id,registration_number,name,username,password_hash,avatar_url,created_at,updated_at FROM community_users WHERE LOWER(username)=LOWER($1) LIMIT 1`,[username]);return r.rows[0]||null;}
 static async findById(id){const r=await pool.query(`SELECT id,registration_number,name,username,avatar_url,created_at,updated_at FROM community_users WHERE id=$1`,[id]);return r.rows[0]||null;}
 static async create({name,username,passwordHash}){const r=await pool.query(`INSERT INTO community_users(name,username,password_hash) VALUES($1,$2,$3) RETURNING id,registration_number,name,username,avatar_url,created_at,updated_at`,[name,username,passwordHash]);return r.rows[0];}
 static async update(id,fields){const entries=Object.entries(fields).filter(([k,v])=>['name','username','avatar_url'].includes(k)&&v!==undefined);if(!entries.length)return this.findById(id);const values=[id],sets=entries.map(([k,v],i)=>{values.push(v);return `${k}=$${i+2}`});const r=await pool.query(`UPDATE community_users SET ${sets.join(', ')},updated_at=NOW() WHERE id=$1 RETURNING id,registration_number,name,username,avatar_url,created_at,updated_at`,values);return r.rows[0]||null;}
}
module.exports=CommunityUser;
