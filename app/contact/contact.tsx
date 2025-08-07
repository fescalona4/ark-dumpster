import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropoffCalendar } from "../../components/dropoffCalendar";


const Contacts = () => (
  <div className="flex items-center justify-center pb-16 md:px-16 mb-2 md:mb-4 mx-2 md:mx-4 rounded-lg bg-gradient-to-r from-orange-900/80 via-orange-800/70 to-rose-900/90 dark:from-orange-900/70 dark:via-orange-800/70 dark:to-rose-900/70">
    <div className="w-full max-w-screen-xl mx-auto">

      <div className="mt-24 grid lg:grid-cols-2 gap-16 md:gap-10 text-primary-foreground dark:text-foreground">


        <div className="flex flex-col justify-start min-h-full gap-4 px-6">
          <div>
            <Badge variant="outline" className="gap-1.5 text-sm px-2 py-0.5 text-primary-foreground dark:text-foreground">
              Contact Us
            </Badge>
            <h1 className="text-5xl mb-4 pt-2 flex">
              Get in touch
            </h1>
            <h3 className="text-xl mb-8 font-light">
              Need a dumpster rental? We&apos;re here to help with your project.
              Contact us for a free quote today.
            </h3>
          </div>

          <div className="flex max-md:flex-col justify-between">
            <h3 className="font-semibold text-lg">Phone:</h3>
            <Link
              className="font-light text-lg"
              href="tel:7275641794  "
            >
              (727) 564-1794
            </Link>
          </div>
          <div className="flex max-md:flex-col justify-between">
            <h3 className="font-semibold text-lg">Email:</h3>
            <Link
              className="font-light text-lg"
              href="_blank"
            >
              arkdumpsterrentals@gmail.com
            </Link>
          </div>
          <div className="flex max-md:flex-col justify-between">
            <h3 className="font-semibold text-lg">Located:</h3>
            <Link
              className="font-light text-lg"
              href="https://maps.app.goo.gl/7q2pPdKkbd7138ZY6"
              target="_blank"
            >
              St. Petersburg, FL
            </Link>
          </div>

          <hr className="my-4 md:my-8 border-border" />
          <h3 className="text-2xl font-semibold md:mb-4">Follow us</h3>
          <div className="flex items-center gap-4">
            <Link
              href="https://instagram.com/arkdumpsterrentals"
              target="_blank"
            >
              <Instagram className="h-6 w-6 dark:text-muted-foreground" />
            </Link>
            <Link
              href="https://facebook.com/share/19WqphXmho/?mibextid=wwXlfr"
              target="_blank"
            >
              <Facebook className="h-6 w-6 dark:text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-gray-950/30 backdrop-blur-lg shadow-none border mx-2">
          <CardContent className="p-4 md:p-10">
            <form>
              <div className="grid md:grid-cols-6 gap-x-8 gap-y-6">
                <div className="col-span-6 sm:col-span-3">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    placeholder="First name"
                    id="firstName"
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    placeholder="Last name"
                    id="lastName"
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    placeholder="Email"
                    id="email"
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    placeholder="Street address"
                    id="address"
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    placeholder="City"
                    id="city"
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    placeholder="State"
                    id="state"
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    placeholder="ZIP Code"
                    id="zipCode"
                    className="mt-1.5 bg-white h-11 shadow-none"
                  />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <DropoffCalendar />
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="timeNeeded">Time Needed</Label>
                  <Select>
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select duration</SelectLabel>
                        <SelectItem value="1-day">1 Day</SelectItem>
                        <SelectItem value="2-6-days">2-6 Days</SelectItem>
                        <SelectItem value="1-week">1 Week</SelectItem>
                        <SelectItem value="2-weeks">2 Weeks</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>



                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor="dumpsterSize">Dumpster Size</Label>
                  <Select>
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select size</SelectLabel>
                        <SelectItem value="15">15 Yard Dump Trailer</SelectItem>
                        <SelectItem value="20">20 Yard Dumpster</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>



                <div className="col-span-6">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Message"
                    className="mt-1.5 bg-white shadow-none"
                    rows={6}
                  />
                </div>
              </div>
              <Button className="mt-6 w-full bg-accent/70 dark:text-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-900/80" size="lg">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default Contacts;
