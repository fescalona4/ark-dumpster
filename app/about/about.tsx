import Link from 'next/link';
import { Badge } from "@/components/ui/badge";

export default function AboutSection() {
    return (
        <div className="flex items-center justify-center px-6 md:px-20 mt-24 md:mt-8 mb-24">
            <div className="max-w-screen-xl flex flex-col md:flex-row gap-10 md:gap-16">
                <div className="flex-1 mt-2">
                    <Badge variant="outline" className="gap-1.5 text-sm px-2 py-0.5">
                        About us
                    </Badge>
                    <h1 className="text-5xl text-foreground md:mb-4 pt-2 flex items-center">
                        dumpster rental specialists
                    </h1>
                </div>
                <div className="flex-3">
                    <p className="text-2xl bold leading-relaxed pr-10 md:pt-2">
                        Your trusted partner for reliable dumpster rental services.
                        Whether you are tackling a home renovation, construction project, or major cleanout,
                        Ark Dumpster provides convenient, affordable waste management solutions. With our commitment to exceptional service and competitive pricing,
                        we make waste disposal simple so you can focus on what matters most.
                        {/* <span className="align-super bold text-2xl">®</span> */}
                    </p>
                </div>
            </div>
        </div>
    );
}
