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
			}.bind(this),500);
		}	
	});
	
	$('.searchBox').focusout(function() {
		$(this).css("border-color","#1671CC");
		$(this).css("width","30px");
		$(this).attr("placeholder", "GO");
		$(this).css("box-shadow","");
	}); 
	
});

class App extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return <div>Test</div>;
	}
}

//ReactDOM.render(<App/>, document.querySelector(".app"));