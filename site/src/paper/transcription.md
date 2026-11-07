# Appendix B. Transcription of the 2016 paper
Transcribed from Sahil's photos of the printed copy, wording and punctuation as printed, including the original's slips (they are part of the record and the Act 1 margin notes point at some of them). Bracketed lines describe images and figures. This text is the source for src/paper/transcription.md and must not be edited there.
Cover
[Stylized portrait of a player looking up, in a dark blue frame. Not reusable; replaced by still S1.]
The Long Range Game A STUDY OF THE THREE POINTER Sahil Shah | Data Visualization | June 20, 2016
Page 1: Introduction
[NBA logo, top right. Not reusable.]
Ever since its introduction during the 1979-1980 season, the three point line has been a game changing addition to professional basketball. The line is 22 feet away from the basket from each corner, and lengthens to 23 feet when you pass the intersection of the arc and the straight line.
The goal of this study is to show how the value of the 3 point line is more favored than it was 20 years ago. This study hopes to show that there is a new era of basketball on display. Players and coaches have evolved with the game over the past 2 decades.
Note: Data was provided courtesy of NBA Miner.
Here is what this study will look at:
Average 3 point usage over time
Average 3 point conversion over time
3 Point and Midrange heat maps
Steph Curry correlation
[Photo of a player dribbling, lower right. Not reusable.]
Page 2: Distance Usage and Conversion
The usage data that was collected contained statistics on how often certain shot distances were used. I compiled this data to include these stats over the past 19 seasons. Subsequently, I presented the average usage percentage over time in figure 1-1. The usage data also pointed towards higher conversion rates for 3 pointers. For data simplification purposes, not every season is listed.
FIGURE 1-1 From the end of the 1998 NBA season to just before the start of the 2016 NBA Finals, the shots that averaged in the range beyond 24 feet from the basket nearly doubled in usage percentage. The three ball went from a luxury to a necessity.
[Line chart on a light blue panel. Y-axis "Avg. 24+ Feet Usage %", 13 to 29. X-axis from "98' Season" to "16' Season". The line starts near 15.7, climbs with a plateau near 22 around 2012–2014, and ends near 28.]
FIGURE 1-2 Following the same timescale, since the usage increased, made 3 point basket consequently increased. Players were gaining better skills to utilize and convert on the 3 point shot.
[Line chart on a light blue panel. Y-axis "Avg. 3P FGM", 5.0 to 9.0. X-axis "98' Season" to "16' Season". The line starts near 5.1, dips near 2004 and again near 2014, and ends near 8.6.]
PAGE 2
Page 3: The Midrange Game's Diminishing Value
In the 90s/early 2000s, the blueprint for success in the NBA was having premium centers/power forwards. For the most part, the strategy back then was to dump the ball down to your big man in the paint and let him out work his defender. If the man in the paint dominated, he could draw double teams and subsequently pass to his shooters. 3 pointers were definitely utilized, but it was the product of playing a game that reflected the "inside first, outside second" way of moving the ball.
Then an evolution occurs. The league gets players like Dirk Nowitzki and Kevin Durant who revolutionize the game by proving that bigs didn't have to live in the paint to be successful. The term "stretch 4" becomes popular. A Stretch 4 means that a player at the 4 position (or even 5 in some cases) can stretch his game out to the three point line, which is difficult ability for average NBA bigs.
The league took notice. Big men with guard capabilities are a common sight in the NBA now, and it directly contributes to increased 3 point line usage.
[Photo of a player in a blue uniform, right margin. Not reusable.]
[Two heat maps side by side with a shared season column, 1997-1998 through 2015-2016. Left: "Midrange Usage Heat Map", dark at the top fading to light at the bottom; legend "Avg. 8-16 Feet Usage %" from 13.853 to 20.917. Right: "3 Pointer Usage Heat Map", light at the top darkening toward the bottom; legend "24+ Feet Usage %" from 753.9 to 1,310.6.]
FIGURE 2 The graph above shows the usage percentage of midrange and 3 pointers over 19 seasons. Lighter colors indicate low percentages and darker colors represent higher percentages.
Midrange shots are still used, but they come at the cost of not being 3 points. There are more players from more positions with the ability to shoot three pointers. You'll notice how midrange usage slowly fades away while 3 point usage slowly becomes more intense in color.
The increased usage and conversion of the three point line has made the midrange game almost obsolete.
PAGE 3
Page 4: Did Steph Curry change the NBA?
[Photo of a player in a blue uniform pointing upward. Not reusable.]
So far, we have looked at the increased use of the three point line which resulted in more 3's being made. We looked at how the increased value of taking three pointers have destroyed the midrange game. Over the past four seasons, the three pointer has been the most popular play of discussion due to Steph Curry's prowess. The hypothesis here is that Steph Curry's abilities have influenced the league to take more 3 pointers.
FIGURE 3 A Pearson Correlation Coefficient Analysis created in Tableau is used to determine the measure of linear correlation between 2 variables
[Scatter plot on a light blue panel. Y-axis "24+ Feet Usage %", 0 to 1300. X-axis "Steph Curry's Average Made 3's per Game", 0.0 to 5.0. Seven points: three clustered near x 2.0 and y 1,000–1,040; three near x 3.3–3.6 and y 1,120–1,250; one near x 5.1 and y 1,310. A linear trend line with a confidence band.]
Take a look at Figure 3. There are a total of 7 plot points because Curry has only been in the league for 7 seasons. Degrees of freedom are the number of independent values that can be assigned to a statistical distribution. In this case, there are 2 because we are looking at the average amount of made 3's by Curry and the average league usage percentage 3's. It's interesting to note that the usage began to increase as soon as Curry started to become who he is today (a lethal three point shooter).
[Box: Trend Lines Model] Number of modeled observations: 7 Number of filtered observations: 0 Model degrees of freedom: 2 Residual degrees of freedom (DF): 5 SSE (sum squared error): 9068.21 MSE (mean squared error): 1813.64 R-Squared: 0.896695 [circled in red] Standard error: 42.5869 p-value (significance): 0.0012104
The value of R can be found on the trend lines model alongside other statistics. The value of the square root of R falls under a few categories. Note that R-Squared is valued at 0.896695. The square root of this number is about 0.95.
PAGE 4
Page 5: What does all this mean?
This means Steph Curry's average made 3's has a very strong positive relationship with increased usage of shots 24+ feet from the basket.
Using tableau, Pearson's R equaled about 0.95. This number is defined by Tableau as a very strong positive relationship. This mean not only are they correlated, but it's possible they can still increase.
[Photo of a player in a white uniform, top right. Not reusable.]
[Box: "As a general rule, you can interpret r values this way:" +.70 or higher indicates a very strong positive relationship [circled in red]; +.40 to +.69 indicates a strong positive relationship; +.20 to +.39 indicates a moderate positive relationship; -.19 to +.19 indicates no or a weak relationship; -.20 to -.39 indicates a moderate negative relationship; -.40 to -.69 indicates a strong negative relationship; -.70 or lower indicates a very strong negative relationship.]
Serge Ibaka (pictured below) is a great example of a player who changed his game in order to keep up with the league. He entered as a defense-first big man without much of an outside shot. Through hard work, he has now a great threat from the perimeter. Another example is Demarcus Cousins, before the 2015-2016 DeMarcus strictly lived in the paint. This season, Cousins has used the three more often than any previous season. Watch any game with the Houston Rockets and you'll immediately see their team philosophy is to either score in the paint or shoot a three. With all that being said, you still have players like Damian Lillard who entered the league already talented from the three point line.
Honestly, you don't even need numbers to see this obvious truth. Watch any NBA game today, and you'll notice that teams just love shooting threes at high rates. There are even more players not mentioned above that Curry has had his effect on. It's absolutely no surprise to see that most players that lack outside shooting abilities have added or attempted to add the three point shot to their arsenal.
[Photo of a player shooting, lower left. Not reusable.]
