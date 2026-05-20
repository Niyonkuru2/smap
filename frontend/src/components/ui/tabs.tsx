import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4 w-full", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        `
        flex
        flex-wrap
        items-center
        gap-3

        w-full

        rounded-2xl
        p-2

        dark-glass
        border
        border-white/10
        bg-transparent
        shadow-sm

        overflow-visible
        `,
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        `
        tab-trigger-premium

        inline-flex
        items-center
        justify-center
        gap-2

        shrink-0
        whitespace-nowrap

        rounded-xl

        border
        border-transparent

        px-4
        py-2.5

        text-sm
        font-medium

        text-muted-foreground

        transition-all
        duration-200

        hover:bg-white/10
        hover:text-white

        data-[state=active]:bg-primary
        data-[state=active]:text-white
        data-[state=active]:shadow-lg

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-primary/40

        disabled:pointer-events-none
        disabled:opacity-50

        [&_svg]:size-4
        [&_svg]:shrink-0
        `,
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none mt-4 animate-fadeIn",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };