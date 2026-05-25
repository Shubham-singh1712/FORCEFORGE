import { createBrowserRouter } from "react-router";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { FocusSessionScreen } from "./screens/FocusSessionScreen";
import { AppBlockingScreen } from "./screens/AppBlockingScreen";
import { AICoachScreen } from "./screens/AICoachScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { WeeklyReportScreen } from "./screens/WeeklyReportScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MainLayout } from "./components/MainLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SplashScreen />,
  },
  {
    path: "/onboarding",
    element: <OnboardingScreen />,
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: "focus", element: <FocusSessionScreen /> },
      { path: "blocking", element: <AppBlockingScreen /> },
      { path: "ai-coach", element: <AICoachScreen /> },
      { path: "stats", element: <StatsScreen /> },
      { path: "rewards", element: <RewardsScreen /> },
      { path: "weekly-report", element: <WeeklyReportScreen /> },
      { path: "profile", element: <ProfileScreen /> },
    ],
  },
]);
