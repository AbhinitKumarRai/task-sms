const jwt        = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const md5        = require('md5');


class TokenManager {
    constructor({config, cache}={}){
        this.config              = config || {
            dotEnv: {
                LONG_TOKEN_SECRET: process.env.LONG_TOKEN_SECRET,
                SHORT_TOKEN_SECRET: process.env.SHORT_TOKEN_SECRET
            }
        };
        this.cache = cache;
        this.longTokenExpiresIn  = '3y';
        this.shortTokenExpiresIn = '1y';
        this.userExposed         = ['v1_createShortToken']; // exposed functions
    }

    /** 
     * short token are issue from long token 
     * short tokens are issued for 72 hours 
     * short tokens are connected to user-agent
     * short token are used on the soft logout 
     * short tokens are used for account switch 
     * short token represents a device. 
     * long token represents a single user. 
     *  
     * long token contains immutable data and long lived
     * master key must exists on any device to create short tokens
     */
    genLongToken({ userId, role, schoolId }) {
        return jwt.sign(
            { 
                role,
                userId,
                schoolId 
            },
            this.config.dotEnv.LONG_TOKEN_SECRET,
            { expiresIn: '90d' }
        );
    }

    genShortToken(payload){
        return jwt.sign(
            payload, 
            this.config.dotEnv.SHORT_TOKEN_SECRET, 
            {expiresIn: this.shortTokenExpiresIn}
        )
    }

    verifyLongToken({ token }) {
        try {
            return jwt.verify(token, this.config.dotEnv.LONG_TOKEN_SECRET);
        } catch (err) {
            console.error('Token verification failed:', err.message);
            return null;
        }
    }
    
    verifyShortToken(token){
        try {
            return jwt.verify(token, this.config.dotEnv.SHORT_TOKEN_SECRET);
        } catch(err) { 
            console.log(err);
            return null;
        }
    }

    /** generate shortId based on a longId */
    v1_createShortToken({__headers, __device}){
        const token = __headers.token;
        if(!token) return {error: 'missing token'};

        let decoded = this.verifyLongToken({ token });
        if(!decoded){ return {error: 'invalid'} };
        
        let shortToken = this.genShortToken({
            userId: decoded.userId, 
            userKey: decoded.userKey,
            sessionId: nanoid(),
            deviceId: md5(__device),
        });

        return { shortToken };
    }
}

module.exports = TokenManager;