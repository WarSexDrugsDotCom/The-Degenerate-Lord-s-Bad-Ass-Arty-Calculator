'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  Bot,
  Mountain,
  Wind,
  Target,
  LocateFixed,
  Rocket,
  ChevronRight,
  Gauge,
  Clock,
  Ruler,
  Hash,
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { FormSchema, type FiringSolution, type RefinedFiringSolution } from '@/lib/types';
import { calculateFiringSolution, fetchWeatherData } from '@/lib/arty';
import { getRefinedSolution } from '@/app/actions';

const WEAPON_SYSTEMS = ['M777 Howitzer', 'AS-90', 'M109 Paladin', 'CAESAR'];
const AMMO_TYPES = ['M795 HE', 'M549 HERA', 'Excalibur'];
const CHARGES = ['Green', 'White', 'Red'];
const PROJECTILE_TYPES = ['Standard', 'Base Bleed', 'Rocket Assisted'];

export function CalculatorPage() {
  const [solution, setSolution] = useState<FiringSolution | null>(null);
  const [refinedSolution, setRefinedSolution] = useState<RefinedFiringSolution | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      weaponSystem: 'M777 Howitzer',
      targetCoordinates: '40.7128, -74.0060',
      weaponCoordinates: '40.7128, -74.0070',
      elevation: 10,
      ammunitionType: 'M795 HE',
      charge: 'White',
      projectileType: 'Standard',
      meteorologicalData: 'Standard atmosphere, no wind.',
      refineWithAI: true,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsCalculating(true);
    setError(null);
    setSolution(null);
    setRefinedSolution(null);

    try {
      // Simulate calculation delay
      await new Promise((resolve) => setTimeout(resolve, 750));

      const initialSolution = calculateFiringSolution(data);
      setSolution(initialSolution);

      if (data.refineWithAI) {
        const aiInput = {
          ...data,
          initialElevation: initialSolution.elevation,
          initialAzimuth: initialSolution.azimuth,
          timeOfFlight: initialSolution.timeOfFlight,
          range: initialSolution.range,
        };
        const result = await getRefinedSolution(aiInput);

        if ('error' in result) {
          throw new Error(result.error);
        }
        setRefinedSolution(result);
      }
    } catch (e: any) {
      const errorMessage = e.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Calculation Failed',
        description: errorMessage,
      });
    } finally {
      setIsCalculating(false);
    }
  }

  const handleFetchWeather = async () => {
    const coords = form.getValues('targetCoordinates');
    toast({ title: 'Fetching Weather...', description: `Getting data for ${coords}` });
    const weatherData = await fetchWeatherData(coords);
    form.setValue('meteorologicalData', weatherData, { shouldValidate: true });
    toast({ title: 'Weather Updated', description: 'Meteorological data has been populated.' });
  };
  
  const AsciiArt = () => (
    <code className="block text-center text-muted-foreground font-code text-xs md:text-sm whitespace-pre">
      (⌐▨_▨)=ε/̵͇̿̿/'̿'̿ ̿ ̿̿ ̿̿ ̿̿ (╥﹏╥)
    </code>
  );

  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter">
          The Degenerate Lord&apos;s Bad Ass Arty Calculator
        </h1>
        <p className="text-muted-foreground">Precision artillery solutions with optional AI-powered refinement.</p>
        <AsciiArt />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-6 h-6" />
              <span>Mission Parameters</span>
            </CardTitle>
            <CardDescription>Enter all required data for the fire mission.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="weaponSystem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weapon System</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a weapon system" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WEAPON_SYSTEMS.map((system) => (
                            <SelectItem key={system} value={system}>
                              {system}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weaponCoordinates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><LocateFixed className="w-4 h-4" /> Own Position</FormLabel>
                        <FormControl>
                          <Input placeholder="Lat, Lon" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetCoordinates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Target className="w-4 h-4"/> Target Position</FormLabel>
                        <FormControl>
                          <Input placeholder="Lat, Lon" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="elevation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Mountain className="w-4 h-4" /> Weapon Elevation (meters)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="ammunitionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center gap-2'><Box className="w-4 h-4" /> Ammo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                              <SelectContent>{AMMO_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="projectileType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center gap-2'><Layers className="w-4 h-4" /> Projectile</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                              <SelectContent>{PROJECTILE_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="charge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center gap-2'><Hash className="w-4 h-4" /> Charge</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                              <SelectContent>{CHARGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                </div>

                <FormField
                  control={form.control}
                  name="meteorologicalData"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="flex items-center gap-2"><Wind className="w-4 h-4" /> MET Data</FormLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={handleFetchWeather}>Fetch Weather</Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Enter meteorological data..." className="min-h-[100px] resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="refineWithAI"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                      <div className="space-y-0.5">
                        <FormLabel className='flex items-center gap-2'><Sparkles className="w-4 h-4 text-accent"/> AI Solution Refinement</FormLabel>
                        <FormDescription>
                          Use GenAI to refine the solution for known system biases.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isCalculating}>
                  {isCalculating ? 'Calculating...' : 'Calculate Firing Solution'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-8">
          {error && (
             <Alert variant="destructive">
               <Bot className="h-4 w-4" />
               <AlertTitle>AI Refinement Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          {isCalculating && <ResultsSkeleton refineWithAI={form.getValues('refineWithAI')} />}
          
          {!isCalculating && !solution && <InitialState />}

          {solution && (
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Standard Ballistic Solution</CardTitle>
                    <CardDescription>Calculated using offline ballistic models.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <SolutionMetric icon={Gauge} label="Elevation" value={solution.elevation.toFixed(4)} unit="°" />
                    <SolutionMetric icon={Target} label="Azimuth" value={solution.azimuth.toFixed(4)} unit="°" />
                    <SolutionMetric icon={Clock} label="Time of Flight" value={solution.timeOfFlight.toFixed(2)} unit="s" />
                    <SolutionMetric icon={Ruler} label="Range" value={(solution.range / 1000).toFixed(2)} unit="km" />
                </CardContent>
             </Card>
          )}
          
          {refinedSolution && (
            <Card className="shadow-lg border-accent">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="text-accent"/>
                        <span>AI Refined Solution</span>
                    </CardTitle>
                    <CardDescription>Subtly adjusted by GenAI for system and ammo biases.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <SolutionMetric icon={Gauge} label="Refined Elevation" value={refinedSolution.refinedElevation.toFixed(4)} unit="°" highlight />
                    <SolutionMetric icon={Target} label="Refined Azimuth" value={refinedSolution.refinedAzimuth.toFixed(4)} unit="°" highlight />
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const SolutionMetric = ({ icon: Icon, label, value, unit, highlight = false }: { icon: React.ElementType, label: string, value: string, unit: string, highlight?: boolean }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
        <Icon className={`w-6 h-6 mb-2 ${highlight ? 'text-accent' : 'text-primary'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className={`font-bold text-lg ${highlight ? 'text-accent-foreground' : 'text-foreground'}`}>
            {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
    </div>
);

const InitialState = () => (
    <Card className="flex flex-col items-center justify-center text-center p-8 min-h-[300px] border-dashed">
        <Target className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <CardTitle className="font-headline">Awaiting Target Data</CardTitle>
        <CardDescription>Enter mission parameters and calculate a solution.</CardDescription>
    </Card>
);

const ResultsSkeleton = ({ refineWithAI }: { refineWithAI: boolean }) => (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
        {refineWithAI && (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )}
    </div>
);
