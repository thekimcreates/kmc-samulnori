// team.js




const members = [


{

name:

"Member Name",

age:

"Age 11",

photo:

"assets/members/member1.png"


},



{

name:

"Member Name",

age:

"Age 12",

photo:

"assets/members/member2.png"


},



{

name:

"Member Name",

age:

"Age 13",

photo:

"assets/members/member3.png"


},



{

name:

"Member Name",

age:

"Age 14",

photo:

"assets/members/member4.png"


},



{

name:

"Member Name",

age:

"Age 15",

photo:

"assets/members/member5.png"


}



];







const memberGrid =

document.getElementById(

"memberGrid"

);









members.forEach(

(member)=>{



const card =

document.createElement(

"div"

);



card.className =

"member-card";






card.innerHTML =


`

<img

src="${member.photo}"

alt="${member.name}">



<div class="member-info">


<h3>

${member.name}

</h3>


<p>

${member.age}

</p>


</div>

`;






memberGrid.appendChild(

card

);



});
