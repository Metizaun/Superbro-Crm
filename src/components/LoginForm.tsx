import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LoginForm = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to CRM Template</h1>
        <p className="text-muted-foreground">
          Get started with our powerful CRM solution to manage your contacts and grow your business.
        </p>
      </div>

      <Button onClick={handleGetStarted} className="w-full" size="lg">
        Get Started
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Join thousands of businesses already using CRM Template
      </p>
    </div>
  );
};
export default LoginForm;