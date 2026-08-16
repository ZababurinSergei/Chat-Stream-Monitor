function rule(ctx, event){
    console.log(event);
    if (event.filed1.length === 0) {
        throw(1);
    }
}

// ZnVuY3Rpb24gcnVsZShjdHgsIGV2ZW50KXsKICAgIGNvbnNvbGUubG9nKCJzb21ldGhpbmciKTsKfQo=