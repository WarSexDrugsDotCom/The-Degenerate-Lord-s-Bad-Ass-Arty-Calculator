
'use client';

import { useState, useEffect } from 'react';
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
  Link,
  ShieldCheck,
  Globe,
  Grid3x3,
  Key,
  Hand,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { FormSchema, type FormValues, type FiringSolution, type FiringSolutionReport } from '@/lib/types';
import { calculateFiringSolution, fetchWeatherData, fetchElevationData, getDistance, getAzimuth, getLatLonString, WEAPON_SYSTEMS } from '@/lib/arty';
import { getFiringSolutionReport } from '@/app/actions';

const getSystems = () => Object.keys(WEAPON_SYSTEMS);

export function CalculatorPage() {
  const [solution, setSolution] = useState<FiringSolution | null>(null);
  const [solutionReport, setSolutionReport] = useState<FiringSolutionReport | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [fetchedRange, setFetchedRange] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const defaultWeapon = getSystems()[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      weaponSystem: defaultWeapon,
      coordinateSystem: 'latlon',
      weaponLat: 40.7128,
      weaponLon: -74.0070,
      targetLat: 40.7128,
      targetLon: -74.0060,
      weaponMgrs: '',
      targetMgrs: '',
      manualRange: 10000,
      manualAzimuth: 45,
      elevation: 10,
      targetElevation: 10,
      ammunitionType: WEAPON_SYSTEMS[defaultWeapon].ammo[0],
      charge: WEAPON_SYSTEMS[defaultWeapon].charges[0],
      projectileType: WEAPON_SYSTEMS[defaultWeapon].projectiles[0],
      meteorologicalData: 'Standard atmosphere, no wind.',
      refineWithAI: true,
    },
  });

  const selectedWeaponSystem = form.watch('weaponSystem');
  const refineWithAI = form.watch('refineWithAI');
  const coordinateSystem = form.watch('coordinateSystem');

  const weaponData = WEAPON_SYSTEMS[selectedWeaponSystem] || WEAPON_SYSTEMS[defaultWeapon];

  useEffect(() => {
    form.setValue('ammunitionType', weaponData.ammo[0]);
    form.setValue('charge', weaponData.charges[0]);
    form.setValue('projectileType', weaponData.projectiles[0]);
  }, [selectedWeaponSystem, form, weaponData]);


  async function onSubmit(data: FormValues) {
    setIsCalculating(true);
    setError(null);
    setSolution(null);
    setSolutionReport(null);
    setFetchedRange(null);

    try {
      const initialSolution = calculateFiringSolution(data);
      setSolution(initialSolution);

      if (data.refineWithAI) {
        const aiInput = {
          weaponSystem: data.weaponSystem,
          elevation: data.elevation,
          targetElevation: data.targetElevation,
          ammunitionType: data.ammunitionType,
          charge: data.charge,
          projectileType: data.projectileType,
          meteorologicalData: data.meteorologicalData,
          initialElevation: initialSolution.elevation,
          timeOfFlight: initialSolution.timeOfFlight,
          range: initialSolution.range,
          initialAzimuth: initialSolution.azimuth,
        };

        // The server action now only receives non-sensitive, relative data.
        const result = await getFiringSolutionReport(aiInput);

        if ('error' in result) {
          throw new Error(result.error);
        }
        setSolutionReport(result);
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

  const handleFetchData = async () => {
    setIsFetchingData(true);
    setFetchedRange(null);
    const values = form.getValues();
    toast({ title: 'Fetching Data...', description: `Getting MET, elevation, and range data.` });

    try {
        const weaponCoords = getLatLonString(values.coordinateSystem, values.weaponLat, values.weaponLon, values.weaponMgrs);
        const targetCoords = getLatLonString(values.coordinateSystem, values.targetLat, values.targetLon, values.targetMgrs);

        if (!weaponCoords || !targetCoords) {
            toast({ variant: 'destructive', title: 'Cannot Fetch Data', description: 'Coordinate data is required to fetch MET and elevation.' });
            setIsFetchingData(false);
            return;
        }

        const weatherPromise = fetchWeatherData(targetCoords);
        const weaponElevationPromise = fetchElevationData(weaponCoords);
        const targetElevationPromise = fetchElevationData(targetCoords);
        const range = getDistance(weaponCoords, targetCoords);
        if (range) setFetchedRange(range);

        const [weatherData, weaponElevationData, targetElevationData] = await Promise.all([
            weatherPromise,
            weaponElevationPromise,
            targetElevationPromise,
        ]);

        form.setValue('meteorologicalData', weatherData, { shouldValidate: true });
        form.setValue('elevation', weaponElevationData, { shouldValidate: true });
        form.setValue('targetElevation', targetElevationData, { shouldValidate: true });

        toast({ title: 'Data Updated', description: 'MET, elevation, and range have been populated.' });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Fetch Data',
            description: e.message || 'Could not retrieve required data.'
        });
    } finally {
      setIsFetchingData(false);
    }
  };
  
  const AsciiArt = () => (
    <code className="block text-center text-muted-foreground font-code text-xs md:text-sm whitespace-pre-wrap">
      (⌐▨_▨)=ε/̵͇̿̿/'̿'̿ ̿ ̿̿ ̿̿ ̿̿ (╥﹏╥)
    </code>
  );

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4">
        <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter">
              The Degenerate Lord&apos;s Bad Ass Arty Calculator
            </h1>
            <p className="text-muted-foreground">Precision artillery solutions with optional AI-powered analysis.</p>
        </div>
        <AsciiArt />
        <p className="text-xs text-muted-foreground/80 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> We ensure that coordinates will not be written to the server logs, protecting our users' privacy.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
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
                          {getSystems().map((system) => (
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
                
                <FormField
                  control={form.control}
                  name="coordinateSystem"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Input Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="latlon" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Globe className="w-4 h-4"/> Lat/Lon</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="mgrs" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Grid3x3 className="w-4 h-4"/> MGRS</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="manual" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Hand className="w-4 h-4"/> Manual</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {coordinateSystem === 'latlon' && (
                  <>
                    <Card className="p-4 bg-background/50">
                        <Label className="flex items-center gap-2 mb-2 text-sm"><LocateFixed className="w-4 h-4"/> Own Position</Label>
                        <div className="grid grid-cols-2 gap-2">
                           <FormField control={form.control} name="weaponLat" render={({field}) => (<FormItem><FormControl><Input placeholder="Latitude" type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                           <FormField control={form.control} name="weaponLon" render={({field}) => (<FormItem><FormControl><Input placeholder="Longitude" type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                        </div>
                    </Card>
                     <Card className="p-4 bg-background/50">
                        <Label className="flex items-center gap-2 mb-2 text-sm"><Target className="w-4 h-4"/> Target Position</Label>
                        <div className="grid grid-cols-2 gap-2">
                           <FormField control={form.control} name="targetLat" render={({field}) => (<FormItem><FormControl><Input placeholder="Latitude" type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                           <FormField control={form.control} name="targetLon" render={({field}) => (<FormItem><FormControl><Input placeholder="Longitude" type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                        </div>
                    </Card>
                  </>
                )}
                {coordinateSystem === 'mgrs' && (
                  <>
                    <FormField
                        control={form.control}
                        name="weaponMgrs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><LocateFixed className="w-4 h-4" /> Own Position (MGRS)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 18S UJ 23480 96270" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="targetMgrs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Target className="w-4 h-4"/> Target Position (MGRS)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 18S UJ 23490 96280" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </>
                )}
                {coordinateSystem === 'manual' && (
                   <Card className="p-4 bg-background/50">
                        <Label className="flex items-center gap-2 mb-2 text-sm"><Ruler className="w-4 h-4"/> Manual Input</Label>
                        <div className="grid grid-cols-2 gap-2">
                           <FormField control={form.control} name="manualRange" render={({field}) => (<FormItem><FormLabel>Range (m)</FormLabel><FormControl><Input placeholder="e.g. 15000" type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                           <FormField control={form.control} name="manualAzimuth" render={({field}) => (<FormItem><FormLabel>Azimuth (°)</FormLabel><FormControl><Input placeholder="e.g. 45.5" type="number" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                        </div>
                    </Card>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="elevation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Mountain className="w-4 h-4" /> Own Elevation (m)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 150" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetElevation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Mountain className="w-4 h-4" /> Target Elevation (m)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 150" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="ammunitionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center gap-2'><Box className="w-4 h-4" /> Ammo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                              <SelectContent>{weaponData.ammo.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                              <SelectContent>{weaponData.projectiles.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
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
                            <FormLabel className='flex items-center gap-2'><Hash className="w-4 h-4" /> {weaponData.chargeLabel}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                              <SelectContent>{weaponData.charges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
                        <Button type="button" variant="ghost" size="sm" onClick={handleFetchData} disabled={isFetchingData || coordinateSystem === 'manual'}>
                          {isFetchingData ? 'Fetching...' : 'Fetch Data'}
                        </Button>
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
                        <FormLabel className='flex items-center gap-2'><Sparkles className="w-4 h-4 text-accent"/> AI Solution Analysis</FormLabel>
                        <FormDescription>
                          Use GenAI to generate a full solution report.
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
                
                <Button type="submit" className="w-full" disabled={isCalculating || isFetchingData}>
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
               <AlertTitle>AI Analysis Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          {isCalculating && <ResultsSkeleton useAI={refineWithAI} />}
          
          {!isCalculating && (!solution && !solutionReport) && <InitialState range={fetchedRange} isFetching={isFetchingData} />}

          {solution && !refineWithAI && (
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
          
          {solutionReport && (
            <Card className="shadow-lg border-accent">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="text-accent"/>
                        <span>AI Firing Solution Report</span>
                    </CardTitle>
                    <CardDescription>Generated by AI based on mission parameters.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm font-code whitespace-pre-wrap bg-secondary/30 p-4 rounded-lg">
                    <code>{solutionReport.report}</code>
                  </pre>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <footer className="pt-8">
        <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className='flex items-center gap-2'>
                        <Key className="w-4 h-4"/>
                        <span>Contact us</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-center gap-4 pt-2">
                          <a href="https://warsexdrugs.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center justify-center gap-1">
                            <Link className="w-4 h-4" />
                            WarSexDrugs.com
                          </a>
                          <a href="https://dopedoohickeys.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center justify-center gap-1">
                            <Link className="w-4 h-4" />
                            DopeDoohickeys.com
                          </a>
                        </div>
                        <Card className="mt-4 bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-lg">PGP Public Key</CardTitle>
                                <CardDescription>For sensitive correspondence, such as reporting accuracy errors which may require coordinate data for verification, please use PGP encryption to ensure privacy. Ivan is a squirrely one. ε/̵͇̿̿/’̿’̿ ̿(╥﹏╥)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-xs font-code whitespace-pre-wrap bg-secondary/30 p-4 rounded-lg overflow-x-auto">
                                    <code>
{`-----BEGIN PGP PUBLIC KEY BLOCK-----
mDMEaRDP+hYJKwYBBAHaRw8BAQdAam/MSMezXgji3cZyUgN9x9bOmaK/KBfnYevA
Es0SoUa0gFRyYXDPiCguXy4gKdmIU2Vuc2VpIMy/zL8gzL/MvyDMv8y/IMy/J8y/
J1zMtc2HzL/Mv1zQtz0oIOKAosyA4bSX4oCizIEgKdmIIEZpbG0gRGVnZW5lcmF0
ZXMgTExDIMKu77iPIDxKS0NpbmVtYUBXYXJTZXhEcnVncy5jb20+iJkEExYKAEEW
IQT7vdG53NwAKOwD7h9S9lzS6O909gUCaRDP+gIbAwUJBaTklgULCQgHAgIiAgYV
CgkICwIEFgIDAQIeBwIXgAAKCRBS9lzS6O909p6LAQCMZyaXXUsovkgR17P6N+DW
n3aX+DWflTmiXhmHXiEU4gD/VOM3tbUYUWjiM3yUvx9GPAX5L8FTo5L73xwGXduq
XQi4OARpEM/6EgorBgEEAZdVAQUBAQdAWUsPhLCATWYTaKz8o6gh2r4xk8bDF6AQ
QNqvSS5sMjkDAQgHiH4EGBYKACYWIQT7vdG53NwAKOwD7h9S9lzS6O909gUCaRDP
+gIbDAUJBaTklgAKCRBS9lzS6O909hMgAP0Wm68Ut4Fya5jff5JKWKcOcYN2+tsu
i2prTbkCG6qawwEAmdG9fQMEvUVZeV8Q1UM1JvX0/hl8N8ZyZW568kDRRAM=
=hmJV
-----END PGP PUBLIC KEY BLOCK-----`}
                                    </code>
                                </pre>
                            </CardContent>
                        </Card>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </footer>
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

const InitialState = ({ range, isFetching }: { range: number | null, isFetching: boolean }) => (
    <Card className="flex flex-col items-center justify-center text-center p-8 min-h-[300px] border-dashed">
      {(isFetching || range) ? (
        <>
          <Ruler className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <CardTitle className="font-headline">Estimated Range</CardTitle>
          {isFetching ? (
            <Skeleton className="h-7 w-32 mt-2" />
          ) : (
            <CardDescription>
              <span className="text-xl font-bold text-foreground">{(range! / 1000).toFixed(2)}</span> km
            </CardDescription>
          )}
        </>
      ) : (
        <>
          <Target className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <CardTitle className="font-headline">Awaiting Target Data</CardTitle>
          <CardDescription>Enter mission parameters and calculate a solution.</CardDescription>
        </>
      )}
    </Card>
  );

const ResultsSkeleton = ({ useAI }: { useAI: boolean }) => (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              {useAI ? (
                  <Skeleton className="h-48 w-full" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
              )}
            </CardContent>
        </Card>
    </div>
);
