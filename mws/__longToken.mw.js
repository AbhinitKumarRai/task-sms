const UserModel = require('../managers/entities/user/user.mongoModel');
const { nonAuthorizedError } = require('../managers/entities/errorHandlers');

module.exports = ({ meta, config, managers }) => {
    return async ({req, res, next}) => {
        try {
            // Skip token check for first user creation
            if (req.path === '/api/user/createUser') {
                const userCount = await UserModel.countDocuments();
                if (userCount === 0) {
                    return next({
                        role: 'super-admin',
                        isFirstUser: true
                    });
                }
            }

            // Check token existence
            const token = req.headers.token;
            if (!token) {
                console.log('Token required but not found');
                return managers.responseDispatcher.dispatch(res, {
                    ok: false,
                    code: 401,
                    errors: 'unauthorized'
                });
            }

            // Verify token
            let decoded = null;
            try {
                decoded = managers.token.verifyLongToken({ token });
                if (!decoded) {
                    console.log('Failed to decode token');
                    return managers.responseDispatcher.dispatch(res, {
                        ok: false,
                        code: 401,
                        errors: 'unauthorized'
                    });
                }

                // Add decoded token to request for use in routes
                req.__longToken = decoded;
                next(decoded);
            } catch (err) {
                console.log('Token verification failed:', err.message);
                return managers.responseDispatcher.dispatch(res, {
                    ok: false,
                    code: 401,
                    errors: 'unauthorized'
                });
            }
        } catch (error) {
            console.error('Auth middleware error:', error);
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 500,
                errors: 'Internal server error'
            });
        }
    };
};