import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Basic Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Card</CardTitle>
          <CardDescription>A simple card with minimal content</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a basic card component that can be used throughout the application.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Cancel</Button>
          <Button className="ml-2">Submit</Button>
        </CardFooter>
      </Card>

      {/* Card with custom styling */}
      <Card className="border-primary">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-primary">Styled Card</CardTitle>
          <CardDescription>A card with custom styling</CardDescription>
        </CardHeader>
        <CardContent>
          <p>You can customize the appearance of cards by adding custom classes.</p>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline">Details</Button>
          <Button variant="default">Action</Button>
        </CardFooter>
      </Card>

      {/* Interactive Card */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>A card with hover effects</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card has a shadow effect when hovered, making it feel interactive.</p>
        </CardContent>
        <CardFooter className="flex-col gap-2 items-stretch">
          <Button variant="outline" className="w-full">Learn More</Button>
          <Button className="w-full">Get Started</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 