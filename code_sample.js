//This section tells the computer the name of all the variables that I am going to use in this program
//and what they are going to do
// Anything written after two slashes is a comment to be read by people not by the computer
int SensorPin = D6;  // this pin is the pin that reads from the sensor
int REDled = D1;
int GREENled = D2;
int BLUEled = D3;
int LEDpower = D0; //this pin will power the LED
unsigned long starttime;
unsigned long sampletime_ms = 30000;  //Length of sampling time before it reports. 30,000=30 sec.  You can change this
unsigned long triggerOnP2;
unsigned long triggerOffP2;
unsigned long pulseLengthP2;
unsigned long durationP2;
boolean valP2 = HIGH;
boolean triggerP2 = false;
float ratioP2 = 0;  // start the code with the ratio set to 0.  This clears any previous data
float PM25 = 0; // start the code with the PM25 set to 0.  This clears any previous data
float brightness = 125;  // this is how bright you want the LED.  0 is off, 255 is full brightness.  You can change this
​
//used to control the wifi if being used in an area where there is no wifi
const uint32_t msRetryTime  =   30000; // stop trying to connect to the internet after 30sec of boot up
SYSTEM_MODE(SEMI_AUTOMATIC)
SYSTEM_THREAD(ENABLED)
// end of Wifi checking
​
TCPClient client; 
​
#define THINGNAME "SJEQ-D-1" //change the name in the " " can be anything.  "upstairsbath"  This is for naming your device on dweet.io
// I use the name that is given to the photon.  Don't use spaces. Go to  http://dweet.io/follow/thingname  to see the results in your browser. change "thingname" to your thingname
​
​
void setup()
{
  // This section of code only runs once.  Right after the photon is turned on or code is loaded.
  // Serial.begin(9600);
   pinMode(REDled, OUTPUT);
   pinMode(GREENled, OUTPUT);
   pinMode(BLUEled, OUTPUT);
   pinMode(LEDpower, OUTPUT);
  pinMode(SensorPin,INPUT); // this tells my program that pin 6 is an input pin.  Meaning I will read or listen to this pin
  starttime = millis();//millis() is the on chip timer that starts running when the program starts running.  
  //Tells you how many milliseconds since the program started
   
   Particle.connect();  //if it can't connect to the internet in 30 seconds of booting up it will turn the Wifi off and keep running
     if (!waitFor(Particle.connected, msRetryTime))  
    WiFi.off(); // if the wifi comes back it will not turn the wifi on the photon.  You must reset it to get it back on wifi.
    
    analogWrite(LEDpower, brightness); //turns on the LEDpower pin to whatever brightness power you have choosen.  It will stay on.
     
    digitalWrite(REDled, HIGH); // turn the Red LED on while waiting for the sensor to warmup
    digitalWrite(GREENled, LOW);
    digitalWrite(BLUEled, LOW);
    delay(120000); //this delays the sensor for 2 minutes while it warms up.  You can change this.
    
}
​
void loop(){ // Sensor reading code written by Matthew Schroyer, MentalMunition.com
      valP2 = digitalRead(SensorPin); //Now I am listening to pin 6.  It has two options "high" or "low"
 
     if(valP2 == LOW && triggerP2 == false){
    triggerP2 = true;
    triggerOnP2 = micros();
  }
  
    if (valP2 == HIGH && triggerP2 == true){
      triggerOffP2 = micros();
      pulseLengthP2 = triggerOffP2 - triggerOnP2;
      durationP2 = durationP2 + pulseLengthP2;
      triggerP2 = false;
  }
    if ((millis() - starttime) > sampletime_ms) {  //if the difference between what time it is right now and when this sample started is greater than our sample time
    //than end this sample and report the data.  
    
    ratioP2 = durationP2/(sampletime_ms*10.0);  //  percentage 0=>100   Percent of time this pin was triggered during sampling. 
    //a higher ratio is dirtier air.
   
    PM25= ratioP2 * ratioP2 * .1809 + 3.8987 * ratioP2; // +2.5003;   //This is the calibration between the ratio and PM25.  Change this to calibrate the PM25 reading in ug/m3
    
    //this section controls what color the LED is at on different PM25 levels. HIGH = off  LOW = on  Feel free to change the cutoff numbers.
    if (PM25 < 10) //green
    {
        digitalWrite(REDled, LOW);
        digitalWrite(GREENled, HIGH);
        digitalWrite(BLUEled, LOW);
        
    }
    if (PM25 < 20 && PM25 > 10)  // cyan
 {
        digitalWrite(REDled, LOW);
        digitalWrite(GREENled, HIGH);
        digitalWrite(BLUEled, HIGH);
    }
     if (PM25 < 30 && PM25 > 20) // blue
 {
        digitalWrite(REDled, LOW);
        digitalWrite(GREENled, LOW);
        digitalWrite(BLUEled, HIGH);
    }
     if (PM25 < 40 && PM25 > 30) // magenta
 {
        digitalWrite(REDled, HIGH);
        digitalWrite(GREENled, LOW);
        digitalWrite(BLUEled, HIGH);
    }
     if (PM25 < 100 && PM25 > 40)// red
 {
        digitalWrite(REDled, HIGH);
        digitalWrite(GREENled, LOW);
        digitalWrite(BLUEled, LOW);
    }
       if (PM25 > 100)  // white
 {
        digitalWrite(REDled, HIGH);
        digitalWrite(GREENled, HIGH);
        digitalWrite(BLUEled, HIGH);
    }
    //ends the LED control section
    
    // Starts the section that will publish the results to DWEET, like twitter for devices
    if (client.connect("dweet.io", 80))  
    // Go to  http://dweet.io/follow/thingname  to see the results in your browser. change "thingname" to your thingname in the web address.
    {
 
      client.print("GET /dweet/for/");
      client.print(THINGNAME);
      client.print("?ratioP2=");  // Don't use spaces for data names
      client.print(ratioP2);
      client.print("&PM25=");  // Don't use spaces for data names
      client.print(PM25);
      client.println(" HTTP/1.1");
      client.println("Host: dweet.io");
      client.println("Connection: close");
      client.println();
           } 
           // ends publishing to DWEET
           
           
    
  
   durationP2 = 0;  //resets the lowpulseoccupancy back to zero to start the next sample
      starttime = millis(); // set the start time to what time it is now.  
      // go back to the top of the loop and start sampling again
    
}
    
    }
