const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("./config");

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      proxy: true,
    },
    (_accessToken, _refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;

      done(null, {
        googleId: profile.id,
        email,
        name: profile.displayName,
        emailVerified:
          profile.emails?.[0]?.verified === true ||
          profile._json?.email_verified === true,
      });
    },
  ),
);

module.exports = passport;