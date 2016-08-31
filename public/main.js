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
	
});

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { bars: [] };
	}
	
	componentDidMount() {
		if (barList!="none") {
			var bars = JSON.parse(barList);
			this.setState({ bars: bars.businesses.slice() });
		}
	}
	
	render() {
			return <div>
				{
					this.state.bars.map(function(bar) {
						return <BarBox rating={bar.rating} ratingImg={bar.rating_img_url} name={bar.name} url={bar.url} img={bar.image_url} id={bar.id} key={bar.id}/>; 
					})
				}
			</div>;
		
	}
}

class BarBox extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div className="barBox">
				{this.props.name}
				<hr/>
			</div>
			
			
		);
	}
}

ReactDOM.render(<App/>, document.querySelector(".app"));








