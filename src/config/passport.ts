import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import prisma from "../utils/prisma";
import { VerifyCallback } from "passport-oauth2";

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found"));
          }

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                accessToken,
                refreshToken,
              },
            });
          } else {
            user = await prisma.user.update({
              where: { email },
              data: { accessToken, refreshToken },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id as string);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  });
};
