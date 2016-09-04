import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

$(document).ready(function() {
	var timer;
	$('.searchBox').hover(function() {
		clearTimeout(timer);
		$(this).css("width","250px");
		$(this).attr("placeholder"," ");
		$(this).css("border-color","#A3DAE3");
		$(this).css("box-shadow","0px 0px 5px 1px #A5F1F2");
	}, function() {
		$(this).css("box-shadow","");
		if (!$('.searchBox').is(":focus")) {
			timer = setTimeout(function() {
				$(this).css("border-color","#1671CC");
				$(this).css("width","30px");
				$(this).attr("placeholder", "GO");
				$(this).val("");
			}.bind(this),500);
		}	
	});
	
	$('.searchBox').focusout(function() {
		$(this).css("border-color","#1671CC");
		$(this).css("width","30px");
		$(this).attr("placeholder", "GO");
		$(this).css("box-shadow","");
		$(this).val("");
	}); 
	
	$(document).on('mouseenter', '.barBox', function() {
		$(this).animate({width:"+=50",height:"+=25"},250);
	});
	$(document).on('mouseleave', '.barBox', function() {
		$(this).animate({width:"-=50",height:"-=25"},250);
	});
	
	$(document).on('mouseenter', '.goingBtn', function() {
		$(this).css("border-color","black");
		$(this).css("color","black");
		
	});
	$(document).on('mouseleave', '.goingBtn', function() {
		$(this).css("border-color","");
		$(this).css("color","");
	});
	
	
});

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { bars: [], attendees: [], userAttending: "none"};
		this.decrementCount = this.decrementCount.bind(this);
		this.incrementCount = this.incrementCount.bind(this);
	}
	
	componentDidMount() {
		if (barList!="none") {
			var bars = JSON.parse(barList);
			var arr = bars.businesses.map(function(item) {
				return item.id; 
			});
			var obj = { "idArr": arr };
			$.ajax({
				url:'/getAttendees',
				data:obj,
				dataType:'json',
				success:function(data) {
					if (data.payload=="none") { //none attended, just send the bars from the Yelp api call
						this.setState({ bars: bars.businesses.slice() });
					}
					else { //attendees holds attended bars data
						var attending = "none";
						data.payload.forEach(function(item) {
							if (item.attendees.indexOf(data.user)>=0) { //if user already attending a bar, set userAttending
								attending = item.bar_id;
							}
						});
						this.setState({ bars: bars.businesses.slice(), attendees: data.payload.slice(), userAttending: attending });
					}
				}.bind(this),
				error:function(err) {
					console.log("Error pulling attended bars.");
				}
				
			});
			
			
			
		}
	}
	
	incrementCount(id, user) { //increase count of bar with id 
		if (this.state.attendees.length<=0) { //handle case for first doc
			var arr = [];
			var attends = [];
			attends.push(user);
			arr.push({ bar_id: id, attendees: attends.slice(), count: 1, date: new Date() });
			this.setState({ attendees: arr.slice(), userAttending: id});
		}
		else {
			var index = 0;
			for (var i=0; i<this.state.attendees.length; i++) {
				if (this.state.attendees[i].bar_id == id) {
					index = i;
				}
			}
			var arr = this.state.attendees.slice();
			console.log(index);
			console.log(arr);
			arr[index] = { bar_id: arr[index].bar_id, attendees: arr[index].attendees, count: arr[index].count + 1, date: arr[index].date };
			this.setState({ attendees: arr.slice(), userAttending: id});
		}
	}
	
	decrementCount(id) { //decrease count of bar with id
		if (this.state.attendees.length<=0) { //handle case for first doc
			//not needed
		}
		else {
			var index = 0;
			for (var i=0; i<this.state.attendees.length; i++) {
				if (this.state.attendees[i].bar_id == id) {
					index = i;
				}
			}
			var arr = this.state.attendees.slice();
			arr[index] = { bar_id: arr[index].bar_id, attendees: arr[index].attendees, count: arr[index].count - 1, date: arr[index].date };
			this.setState({ attendees: arr.slice(), userAttending: "none"});
		}
		
	}
	
	render() {
		var arr = this.state.attendees.slice();
			return <div>
				{
					this.state.bars.map(function(bar) {
						var count = 0;
						arr.forEach(function(item) {
							if (item.bar_id == bar.id) {
								count=item.count;
							}
						});
						return <BarBox rating={bar.rating} num_attending={count} userAttending={this.state.userAttending} snippet={bar.snippet_text} ratingImg={bar.rating_img_url} name={bar.name} url={bar.url} img={bar.image_url} id={bar.id} key={bar.id} decrementCount={this.decrementCount} incrementCount={this.incrementCount} />; 
					}.bind(this))
				}
			</div>;
		
	}
}

class BarBox extends React.Component {
	constructor(props) {
		super(props);
	}
	
	attending() { //click event for attending/unattending a bar 
		if (this.props.userAttending!="none" && (this.props.userAttending!=this.props.id)) {
			alert("You have already committed to another bar!");
		}
		else {
			$.ajax({
				url:'/attendingBar',
				data:{theID: this.props.id},
				dataType:'json',
				success:function(data) {
					if (data.payload=="login") { 
						alert("You must be logged in to attend.");
					}
					else if (data.payload=="unattended") { //unattending bar
						this.props.decrementCount(this.props.id);
					
					}
					else { //attending
						this.props.incrementCount(this.props.id, data.user);
					}
				}.bind(this),
				error: function(err) {
					console.log("Error changing attendees.");
				}
				
			});
		}
		
	}
	
	getClasses() { //set style of the attending button based on if user is going
		if (this.props.userAttending==this.props.id) {
			return "goingBtn going";
		}
		else {
			return "goingBtn";
		}
	}
	
	render() {
		return (
			<div className="barBox">
				<span className="barName">{this.props.name}</span>
				<hr/>
				<img src={this.props.img}/>
				<img className="rating" src={this.props.ratingImg}/>
				<div className="snipBox">
					<p className="snippet">{this.props.snippet}</p>
				</div>
				<div onClick={this.attending.bind(this)} className={this.getClasses()}>
					<span>ATTENDING: </span><span className="counter">{this.props.num_attending}</span>
				</div>
			</div>
			
			
		);
	}
}

ReactDOM.render(<App/>, document.querySelector(".app"));








