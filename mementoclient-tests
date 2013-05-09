The [new Memento-draft](http://tools.ietf.org/html/draft-vandesompel-memento-07) has a simple stateless program flow. All memento clients should have a set of test cases to ensure that the correct behavior is being exhibited. The list of clients thus far are tachywon, mcurl, and MementoFox. mcurl is in-development and the author, Ahmed AlSum has proposed some examples. Below is an attempt at formalizing these examples into test cases. Some EBNF or grammar ought to be established eventually but this is a start.

General Grammar Definition. "*" means optional

testname
HTTP request type (HEAD|GET|POST)
* Follow Boolean, for 3XX, correct value are FOLLOW 
* Accept-Datetime, correct value example: Sun, 23 July 2006 12:00:00 GMT
* Timegate URL
url
[response codes, crlf delimited)

TODO: create a BNF for the above

Start of test cases

Content negotiation in the datetime dimension, uses the default timegate when required 
HEAD
FOLLOW
Sun, 23 July 2006 12:00:00 GMT' 
http://www.cnn.com 
302
200 


Calling timemap in link format with the default timegate, it will download the timemap on application-link format, it uses the default timegate 
HEAD
FOLLOW
http://www.cnn.com 
200 

Calling an original resource with a specific timegate, content negotiation in the datetime dimension and get the last memento, it uses the specified timegate when required 
HEAD
http://mementoproxy.lanl.gov/aggr/timegate/
http://www.cnn.com 
302
200 

Calling an original resource with a specific timegate
mcurl.pl -I -L --debug --datetime 'Sun, 23 July 2006 12:00:00 GMT' --timegate 'http://mementoproxy.lanl.gov/aggr/timegate/' http://www.cnn.com 
Expected results: it will do the content negotiation in the datetime dimension, it uses the specified timegate when required 
Response code: 302 -> 200 

Calling timemap in link format with the specific timegate, it will download the timemap on application-link format, it uses the specified timegate when required 
HEAD
FOLLOW
http://mementoproxy.lanl.gov/aggr/timegate/
http://www.cnn.com 
200 

Calling an original resource that has a specific timegate, Expected results: it will do the content negotiation in the datetime dimension, the site will provide a timegate which will override the default timegate 
HEAD
FOLLOW
Thu, 23 July 2009 12:00:00 GMT
http://lanlsource.lanl.gov/hello 
302
200 

Calling an original resource (R1) that has a redirection (R2), (R1) has valid mementos, it will do the content negotiation in the datetime dimension, R1 has valid mementos; so the result will be for R1 only. 
HEAD
FOLLOW
Thu, 23 July 2009 12:00:00 GMT
http://www.zeit.de/ 
302
200 

Calling an original resource (R1) that has a redirection (R2), (R1) does NOT have valid mementos, it will do the content negotiation in the datetime dimension, R1 doesn't have valid mementos; so the result will be for R2 only. 
HEAD
FOLLOW
Thu, 23 July 2009 12:00:00 GMT
http://lanlsource.lanl.gov 
302
200 

Calling an original resource that has a timegate redirection
mcurl.pl -I -L --debug --datetime "Mon, 23 July 2007 12:00:00 GMT" http://lanlsource.lanl.gov/hello 
Expected results: it will do the content negotiation in the datetime dimension, the site will provide a timegate which will override the default timegate. The timegate /tg/ has a redirection to /ta/ 

Calling an original resource that has a timegate redirection, it will do the content negotiation in the datetime dimension, the site will provide a timegate which will override the default timegate. The timegate /tg/ has a redirection to /ts/ 
HEAD
FOLLOW
Sat, 23 July 2011 12:00:00 GMT
http://lanlsource.lanl.gov/hello 

Calling an original resource with Acceptable time period, it will do the content negotiation in the datetime dimension with specified time period which has valid mementos, it uses the default timegate when required
HEAD
FOLLOW
Thu, 23 July 2009 12:00:00 GMT; -P5MT5H;+P5MT6H'
http://www.cs.odu.edu 
302
200 

Calling an original resource with NOT Acceptable time period, it will do the content negotiation in the datetime dimension with specified time period which does not have any valid mementos, it uses the default timegate when required 
HEAD
FOLLOW
Thu, 23 July 2009 12:00:00 GMT; -P5MT5H;+P5MT6H
http://www.cs.odu.edu  
406 

Calling an original resource with invalid Accept-datetime header
HEAD
Sun, 23 July xxxxxxxxxxxxxxxx
http://www.cnn.com 
400 

Override the discovered timegate with the specific one
HEAD
FOLLOW
Sat, 23 July 2011 12:00:00 GMT
http://mementoproxy.cs.odu.edu/aggr/timegate
http://lanlsource.lanl.gov/hello 

using the --replacedump switch to dump the replacement for the embedded resources to an external file for further analysis
mcurl.pl -L --mode strict --datetime "Sat, 03 Dec 2010 12:00:00 GMT" --replacedump cnnreplace.txt http://www.cnn.com 

accessing the dbpedia archive
mcurl.pl -L --mode strict --datetime "Sat, 03 Dec 2010 12:00:00 GMT" http://dbpedia.org/page/Brisbane
